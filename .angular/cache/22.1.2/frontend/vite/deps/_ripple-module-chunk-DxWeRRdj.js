import { sa as ɵɵdefineInjector } from "./_resource-chunk-BKjjpPrA.js";
import { Nn as NgModule, Oi as setClassMetadata, Va as ɵɵdefineNgModule } from "./core-tK2ALGvq.js";
import { n as MatRipple } from "./_ripple-chunk-CPd7zeeA.js";
import { t as BidiModule } from "./bidi-BWzGJE9s.js";
//#region node_modules/@angular/material/fesm2022/_ripple-module-chunk.mjs
var MatRippleModule = class MatRippleModule {
	static ɵfac = function MatRippleModule_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || MatRippleModule)();
	};
	static ɵmod = /* @__PURE__ */ ɵɵdefineNgModule({
		type: MatRippleModule,
		imports: [MatRipple],
		exports: [MatRipple, BidiModule]
	});
	static ɵinj = /* @__PURE__ */ ɵɵdefineInjector({ imports: [BidiModule] });
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatRippleModule, [{
		type: NgModule,
		args: [{
			imports: [MatRipple],
			exports: [MatRipple, BidiModule]
		}]
	}], null, null);
})();
//#endregion
export { MatRippleModule as t };
