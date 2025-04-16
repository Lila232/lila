package lila.ublog

import com.typesafe.config.{ Config, ConfigFactory }
import play.api.{ ConfigLoader, Configuration }
import play.api.libs.json.*
import play.api.libs.ws.*
import play.api.libs.ws.JsonBodyWritables.*
import play.api.libs.ws.DefaultBodyReadables.readableAsString

import lila.memo.SettingStore
import lila.core.data.Text
import lila.memo.SettingStore.Text.given
import lila.core.config.Secret

object UblogAutomod:

  case class Config(apiKey: Secret, model: String, url: String)

  case class Result(classification: String, flagged: Option[String], commercial: Option[String])
  private given Reads[Result] = Json.reads[Result]
  import reactivemongo.api.bson.{ BSONWriter, Macros }
  given resultWriter: BSONWriter[Result] = Macros.handler

final class UblogAutomod(
    ws: StandaloneWSClient,
    appConfig: Configuration,
    settingStore: lila.memo.SettingStore.Builder
)(using Executor):

  val promptSetting = settingStore[Text](
    "ublogAutomodPrompt",
    text = "Ublog automod prompt".some,
    default = Text("")
  )

  private val cfg =
    import lila.common.config.given
    import lila.common.autoconfig.AutoConfig
    appConfig.get[UblogAutomod.Config]("ublog.automod")(AutoConfig.loader)

  def fetch(userText: String): Fu[Option[UblogAutomod.Result]] =
    val prompt = promptSetting.get().value
    (cfg.apiKey.value.nonEmpty && prompt.nonEmpty).so:
      val body = Json.obj(
        "model" -> cfg.model,
        // "response_format" -> "json", // not universally supported it seems
        // "temperature" -> 0.7,
        // "top_p" -> 1,
        // "frequency_penalty" -> 0,
        // "presence_penalty" -> 0
        "messages" -> Json.arr(
          Json.obj("role" -> "system", "content" -> prompt),
          Json.obj("role" -> "user", "content"   -> userText)
        )
      )
      ws.url(cfg.url)
        .withHttpHeaders(
          "Authorization" -> s"Bearer ${cfg.apiKey.value}",
          "Content-Type"  -> "application/json"
        )
        .post(body)
        .flatMap: rsp =>
          (for
            choices <- (Json.parse(rsp.body) \ "choices").asOpt[List[JsObject]]
            if rsp.status == 200
            best      <- choices.headOption
            resultStr <- (best \ "message" \ "content").asOpt[String]
            result    <- Json.parse(resultStr).asOpt[UblogAutomod.Result]
          yield result) match
            case None      => fufail(s"error: ${rsp.status} ${rsp.body.take(200)}")
            case Some(res) => fuccess(res.some)
