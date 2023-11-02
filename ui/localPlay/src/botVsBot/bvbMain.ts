import { attributesModule, classModule, init } from 'snabbdom';
//import { BvbCtrl } from './bvbCtrl';
import { BvbStockfishWebCtrl } from './bvbStockfishWebCtrl';
//import bvbView from './bvbView';
import bvbStockfishWebView from './bvbStockfishWebView';
import { BvbOpts } from './bvbInterfaces';

const patch = init([classModule, attributesModule]);

export default async function (opts: BvbOpts) {
  //const ctrl = new BvbCtrl(opts, redraw);

  //const blueprint = bvbView(ctrl);
  const ctrl = new BvbStockfishWebCtrl(opts, redraw);
  const blueprint = bvbStockfishWebView(ctrl);
  const element = document.querySelector('main') as HTMLElement;
  element.innerHTML = '';
  let vnode = patch(element, blueprint);

  function redraw() {
    //vnode = patch(vnode, bvbView(ctrl));
    vnode = patch(vnode, bvbStockfishWebView(ctrl));
  }
  redraw();
}
