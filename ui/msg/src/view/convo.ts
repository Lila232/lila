import type MsgCtrl from '../ctrl';
import renderActions from './actions';
import renderInteract from './interact';
import renderMsgs from './msgs';
import type { Convo } from '../interfaces';
import { h, type VNode } from 'snabbdom';
import * as licon from 'lib/licon';
import { hookMobileMousedown } from 'lib/device';
import { userLink } from 'lib/view/userLink';

export default function renderConvo(ctrl: MsgCtrl, convo: Convo): VNode {
  const user = convo.user;
  return h('div.msg-app__convo', { key: user.id }, [
    h('div.msg-app__convo__head', [
      h('div.msg-app__convo__head__left', [
        h('span.msg-app__convo__head__back', {
          attrs: { 'data-icon': licon.LessThan },
          hook: hookMobileMousedown(ctrl.showSide),
        }),
        userLink({ ...user, moderator: user.id === 'lichess' }),
        convo.modDetails?.kid ? h('bad', 'KID') : undefined,
        convo.modDetails?.openInbox === false ? h('bad', "doesn't want messages") : undefined,
      ]),
      h('div.msg-app__convo__head__actions', renderActions(ctrl, convo)),
    ]),
    renderMsgs(ctrl, convo),
    h('div.msg-app__convo__reply', [
      convo.relations.out === false || convo.relations.in === false
        ? blocked('This conversation is blocked.')
        : ctrl.data.me.bot
          ? blocked('Bot accounts cannot send nor receive messages.')
          : convo.postable
            ? renderInteract(ctrl, user)
            : blocked(`${user.name} doesn't accept new messages.`),
    ]),
  ]);
}

const blocked = (msg: string) =>
  h('div.msg-app__convo__reply__block.text', { attrs: { 'data-icon': licon.NotAllowed } }, msg);
