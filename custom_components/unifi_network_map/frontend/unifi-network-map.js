// src/card/shared/constants.ts
var DOMAIN = "unifi_network_map";
var MIN_PAN_MOVEMENT_THRESHOLD = 6;
var ZOOM_INCREMENT = 0.1;
var MIN_ZOOM_SCALE = 0.5;
var MAX_ZOOM_SCALE = 4;
var TOOLTIP_OFFSET_PX = 12;

// node_modules/dompurify/dist/purify.es.mjs
var {
  entries,
  setPrototypeOf,
  isFrozen,
  getPrototypeOf,
  getOwnPropertyDescriptor
} = Object;
var {
  freeze,
  seal,
  create
} = Object;
var {
  apply,
  construct
} = typeof Reflect !== "undefined" && Reflect;
if (!freeze) {
  freeze = function freeze2(x) {
    return x;
  };
}
if (!seal) {
  seal = function seal2(x) {
    return x;
  };
}
if (!apply) {
  apply = function apply2(func, thisArg) {
    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }
    return func.apply(thisArg, args);
  };
}
if (!construct) {
  construct = function construct2(Func) {
    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }
    return new Func(...args);
  };
}
var arrayForEach = unapply(Array.prototype.forEach);
var arrayLastIndexOf = unapply(Array.prototype.lastIndexOf);
var arrayPop = unapply(Array.prototype.pop);
var arrayPush = unapply(Array.prototype.push);
var arraySplice = unapply(Array.prototype.splice);
var stringToLowerCase = unapply(String.prototype.toLowerCase);
var stringToString = unapply(String.prototype.toString);
var stringMatch = unapply(String.prototype.match);
var stringReplace = unapply(String.prototype.replace);
var stringIndexOf = unapply(String.prototype.indexOf);
var stringTrim = unapply(String.prototype.trim);
var objectHasOwnProperty = unapply(Object.prototype.hasOwnProperty);
var regExpTest = unapply(RegExp.prototype.test);
var typeErrorCreate = unconstruct(TypeError);
function unapply(func) {
  return function(thisArg) {
    if (thisArg instanceof RegExp) {
      thisArg.lastIndex = 0;
    }
    for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      args[_key3 - 1] = arguments[_key3];
    }
    return apply(func, thisArg, args);
  };
}
function unconstruct(Func) {
  return function() {
    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }
    return construct(Func, args);
  };
}
function addToSet(set, array) {
  let transformCaseFunc = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : stringToLowerCase;
  if (setPrototypeOf) {
    setPrototypeOf(set, null);
  }
  let l = array.length;
  while (l--) {
    let element = array[l];
    if (typeof element === "string") {
      const lcElement = transformCaseFunc(element);
      if (lcElement !== element) {
        if (!isFrozen(array)) {
          array[l] = lcElement;
        }
        element = lcElement;
      }
    }
    set[element] = true;
  }
  return set;
}
function cleanArray(array) {
  for (let index = 0; index < array.length; index++) {
    const isPropertyExist = objectHasOwnProperty(array, index);
    if (!isPropertyExist) {
      array[index] = null;
    }
  }
  return array;
}
function clone(object) {
  const newObject = create(null);
  for (const [property, value] of entries(object)) {
    const isPropertyExist = objectHasOwnProperty(object, property);
    if (isPropertyExist) {
      if (Array.isArray(value)) {
        newObject[property] = cleanArray(value);
      } else if (value && typeof value === "object" && value.constructor === Object) {
        newObject[property] = clone(value);
      } else {
        newObject[property] = value;
      }
    }
  }
  return newObject;
}
function lookupGetter(object, prop) {
  while (object !== null) {
    const desc = getOwnPropertyDescriptor(object, prop);
    if (desc) {
      if (desc.get) {
        return unapply(desc.get);
      }
      if (typeof desc.value === "function") {
        return unapply(desc.value);
      }
    }
    object = getPrototypeOf(object);
  }
  function fallbackValue() {
    return null;
  }
  return fallbackValue;
}
var html$1 = freeze(["a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "bdi", "bdo", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "decorator", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "marquee", "menu", "menuitem", "meter", "nav", "nobr", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "search", "section", "select", "shadow", "slot", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]);
var svg$1 = freeze(["svg", "a", "altglyph", "altglyphdef", "altglyphitem", "animatecolor", "animatemotion", "animatetransform", "circle", "clippath", "defs", "desc", "ellipse", "enterkeyhint", "exportparts", "filter", "font", "g", "glyph", "glyphref", "hkern", "image", "inputmode", "line", "lineargradient", "marker", "mask", "metadata", "mpath", "part", "path", "pattern", "polygon", "polyline", "radialgradient", "rect", "stop", "style", "switch", "symbol", "text", "textpath", "title", "tref", "tspan", "view", "vkern"]);
var svgFilters = freeze(["feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence"]);
var svgDisallowed = freeze(["animate", "color-profile", "cursor", "discard", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignobject", "hatch", "hatchpath", "mesh", "meshgradient", "meshpatch", "meshrow", "missing-glyph", "script", "set", "solidcolor", "unknown", "use"]);
var mathMl$1 = freeze(["math", "menclose", "merror", "mfenced", "mfrac", "mglyph", "mi", "mlabeledtr", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msup", "msubsup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover", "mprescripts"]);
var mathMlDisallowed = freeze(["maction", "maligngroup", "malignmark", "mlongdiv", "mscarries", "mscarry", "msgroup", "mstack", "msline", "msrow", "semantics", "annotation", "annotation-xml", "mprescripts", "none"]);
var text = freeze(["#text"]);
var html = freeze(["accept", "action", "align", "alt", "autocapitalize", "autocomplete", "autopictureinpicture", "autoplay", "background", "bgcolor", "border", "capture", "cellpadding", "cellspacing", "checked", "cite", "class", "clear", "color", "cols", "colspan", "controls", "controlslist", "coords", "crossorigin", "datetime", "decoding", "default", "dir", "disabled", "disablepictureinpicture", "disableremoteplayback", "download", "draggable", "enctype", "enterkeyhint", "exportparts", "face", "for", "headers", "height", "hidden", "high", "href", "hreflang", "id", "inert", "inputmode", "integrity", "ismap", "kind", "label", "lang", "list", "loading", "loop", "low", "max", "maxlength", "media", "method", "min", "minlength", "multiple", "muted", "name", "nonce", "noshade", "novalidate", "nowrap", "open", "optimum", "part", "pattern", "placeholder", "playsinline", "popover", "popovertarget", "popovertargetaction", "poster", "preload", "pubdate", "radiogroup", "readonly", "rel", "required", "rev", "reversed", "role", "rows", "rowspan", "spellcheck", "scope", "selected", "shape", "size", "sizes", "slot", "span", "srclang", "start", "src", "srcset", "step", "style", "summary", "tabindex", "title", "translate", "type", "usemap", "valign", "value", "width", "wrap", "xmlns", "slot"]);
var svg = freeze(["accent-height", "accumulate", "additive", "alignment-baseline", "amplitude", "ascent", "attributename", "attributetype", "azimuth", "basefrequency", "baseline-shift", "begin", "bias", "by", "class", "clip", "clippathunits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cx", "cy", "d", "dx", "dy", "diffuseconstant", "direction", "display", "divisor", "dur", "edgemode", "elevation", "end", "exponent", "fill", "fill-opacity", "fill-rule", "filter", "filterunits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "fx", "fy", "g1", "g2", "glyph-name", "glyphref", "gradientunits", "gradienttransform", "height", "href", "id", "image-rendering", "in", "in2", "intercept", "k", "k1", "k2", "k3", "k4", "kerning", "keypoints", "keysplines", "keytimes", "lang", "lengthadjust", "letter-spacing", "kernelmatrix", "kernelunitlength", "lighting-color", "local", "marker-end", "marker-mid", "marker-start", "markerheight", "markerunits", "markerwidth", "maskcontentunits", "maskunits", "max", "mask", "mask-type", "media", "method", "mode", "min", "name", "numoctaves", "offset", "operator", "opacity", "order", "orient", "orientation", "origin", "overflow", "paint-order", "path", "pathlength", "patterncontentunits", "patterntransform", "patternunits", "points", "preservealpha", "preserveaspectratio", "primitiveunits", "r", "rx", "ry", "radius", "refx", "refy", "repeatcount", "repeatdur", "restart", "result", "rotate", "scale", "seed", "shape-rendering", "slope", "specularconstant", "specularexponent", "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "stop-color", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke", "stroke-width", "style", "surfacescale", "systemlanguage", "tabindex", "tablevalues", "targetx", "targety", "transform", "transform-origin", "text-anchor", "text-decoration", "text-rendering", "textlength", "type", "u1", "u2", "unicode", "values", "viewbox", "visibility", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "width", "word-spacing", "wrap", "writing-mode", "xchannelselector", "ychannelselector", "x", "x1", "x2", "xmlns", "y", "y1", "y2", "z", "zoomandpan"]);
var mathMl = freeze(["accent", "accentunder", "align", "bevelled", "close", "columnsalign", "columnlines", "columnspan", "denomalign", "depth", "dir", "display", "displaystyle", "encoding", "fence", "frame", "height", "href", "id", "largeop", "length", "linethickness", "lspace", "lquote", "mathbackground", "mathcolor", "mathsize", "mathvariant", "maxsize", "minsize", "movablelimits", "notation", "numalign", "open", "rowalign", "rowlines", "rowspacing", "rowspan", "rspace", "rquote", "scriptlevel", "scriptminsize", "scriptsizemultiplier", "selection", "separator", "separators", "stretchy", "subscriptshift", "supscriptshift", "symmetric", "voffset", "width", "xmlns"]);
var xml = freeze(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]);
var MUSTACHE_EXPR = seal(/\{\{[\w\W]*|[\w\W]*\}\}/gm);
var ERB_EXPR = seal(/<%[\w\W]*|[\w\W]*%>/gm);
var TMPLIT_EXPR = seal(/\$\{[\w\W]*/gm);
var DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]+$/);
var ARIA_ATTR = seal(/^aria-[\-\w]+$/);
var IS_ALLOWED_URI = seal(
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  // eslint-disable-line no-useless-escape
);
var IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
var ATTR_WHITESPACE = seal(
  /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g
  // eslint-disable-line no-control-regex
);
var DOCTYPE_NAME = seal(/^html$/i);
var CUSTOM_ELEMENT = seal(/^[a-z][.\w]*(-[.\w]+)+$/i);
var EXPRESSIONS = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  ARIA_ATTR,
  ATTR_WHITESPACE,
  CUSTOM_ELEMENT,
  DATA_ATTR,
  DOCTYPE_NAME,
  ERB_EXPR,
  IS_ALLOWED_URI,
  IS_SCRIPT_OR_DATA,
  MUSTACHE_EXPR,
  TMPLIT_EXPR
});
var NODE_TYPE = {
  element: 1,
  attribute: 2,
  text: 3,
  cdataSection: 4,
  entityReference: 5,
  // Deprecated
  entityNode: 6,
  // Deprecated
  progressingInstruction: 7,
  comment: 8,
  document: 9,
  documentType: 10,
  documentFragment: 11,
  notation: 12
  // Deprecated
};
var getGlobal = function getGlobal2() {
  return typeof window === "undefined" ? null : window;
};
var _createTrustedTypesPolicy = function _createTrustedTypesPolicy2(trustedTypes, purifyHostElement) {
  if (typeof trustedTypes !== "object" || typeof trustedTypes.createPolicy !== "function") {
    return null;
  }
  let suffix = null;
  const ATTR_NAME = "data-tt-policy-suffix";
  if (purifyHostElement && purifyHostElement.hasAttribute(ATTR_NAME)) {
    suffix = purifyHostElement.getAttribute(ATTR_NAME);
  }
  const policyName = "dompurify" + (suffix ? "#" + suffix : "");
  try {
    return trustedTypes.createPolicy(policyName, {
      createHTML(html2) {
        return html2;
      },
      createScriptURL(scriptUrl) {
        return scriptUrl;
      }
    });
  } catch (_) {
    console.warn("TrustedTypes policy " + policyName + " could not be created.");
    return null;
  }
};
var _createHooksMap = function _createHooksMap2() {
  return {
    afterSanitizeAttributes: [],
    afterSanitizeElements: [],
    afterSanitizeShadowDOM: [],
    beforeSanitizeAttributes: [],
    beforeSanitizeElements: [],
    beforeSanitizeShadowDOM: [],
    uponSanitizeAttribute: [],
    uponSanitizeElement: [],
    uponSanitizeShadowNode: []
  };
};
function createDOMPurify() {
  let window2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : getGlobal();
  const DOMPurify = (root) => createDOMPurify(root);
  DOMPurify.version = "3.3.1";
  DOMPurify.removed = [];
  if (!window2 || !window2.document || window2.document.nodeType !== NODE_TYPE.document || !window2.Element) {
    DOMPurify.isSupported = false;
    return DOMPurify;
  }
  let {
    document: document2
  } = window2;
  const originalDocument = document2;
  const currentScript = originalDocument.currentScript;
  const {
    DocumentFragment,
    HTMLTemplateElement,
    Node,
    Element: Element2,
    NodeFilter,
    NamedNodeMap = window2.NamedNodeMap || window2.MozNamedAttrMap,
    HTMLFormElement,
    DOMParser: DOMParser2,
    trustedTypes
  } = window2;
  const ElementPrototype = Element2.prototype;
  const cloneNode = lookupGetter(ElementPrototype, "cloneNode");
  const remove = lookupGetter(ElementPrototype, "remove");
  const getNextSibling = lookupGetter(ElementPrototype, "nextSibling");
  const getChildNodes = lookupGetter(ElementPrototype, "childNodes");
  const getParentNode = lookupGetter(ElementPrototype, "parentNode");
  if (typeof HTMLTemplateElement === "function") {
    const template = document2.createElement("template");
    if (template.content && template.content.ownerDocument) {
      document2 = template.content.ownerDocument;
    }
  }
  let trustedTypesPolicy;
  let emptyHTML = "";
  const {
    implementation,
    createNodeIterator,
    createDocumentFragment,
    getElementsByTagName
  } = document2;
  const {
    importNode
  } = originalDocument;
  let hooks = _createHooksMap();
  DOMPurify.isSupported = typeof entries === "function" && typeof getParentNode === "function" && implementation && implementation.createHTMLDocument !== void 0;
  const {
    MUSTACHE_EXPR: MUSTACHE_EXPR2,
    ERB_EXPR: ERB_EXPR2,
    TMPLIT_EXPR: TMPLIT_EXPR2,
    DATA_ATTR: DATA_ATTR2,
    ARIA_ATTR: ARIA_ATTR2,
    IS_SCRIPT_OR_DATA: IS_SCRIPT_OR_DATA2,
    ATTR_WHITESPACE: ATTR_WHITESPACE2,
    CUSTOM_ELEMENT: CUSTOM_ELEMENT2
  } = EXPRESSIONS;
  let {
    IS_ALLOWED_URI: IS_ALLOWED_URI$1
  } = EXPRESSIONS;
  let ALLOWED_TAGS = null;
  const DEFAULT_ALLOWED_TAGS = addToSet({}, [...html$1, ...svg$1, ...svgFilters, ...mathMl$1, ...text]);
  let ALLOWED_ATTR = null;
  const DEFAULT_ALLOWED_ATTR = addToSet({}, [...html, ...svg, ...mathMl, ...xml]);
  let CUSTOM_ELEMENT_HANDLING = Object.seal(create(null, {
    tagNameCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    attributeNameCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    allowCustomizedBuiltInElements: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: false
    }
  }));
  let FORBID_TAGS = null;
  let FORBID_ATTR = null;
  const EXTRA_ELEMENT_HANDLING = Object.seal(create(null, {
    tagCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    attributeCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    }
  }));
  let ALLOW_ARIA_ATTR = true;
  let ALLOW_DATA_ATTR = true;
  let ALLOW_UNKNOWN_PROTOCOLS = false;
  let ALLOW_SELF_CLOSE_IN_ATTR = true;
  let SAFE_FOR_TEMPLATES = false;
  let SAFE_FOR_XML = true;
  let WHOLE_DOCUMENT = false;
  let SET_CONFIG = false;
  let FORCE_BODY = false;
  let RETURN_DOM = false;
  let RETURN_DOM_FRAGMENT = false;
  let RETURN_TRUSTED_TYPE = false;
  let SANITIZE_DOM = true;
  let SANITIZE_NAMED_PROPS = false;
  const SANITIZE_NAMED_PROPS_PREFIX = "user-content-";
  let KEEP_CONTENT = true;
  let IN_PLACE = false;
  let USE_PROFILES = {};
  let FORBID_CONTENTS = null;
  const DEFAULT_FORBID_CONTENTS = addToSet({}, ["annotation-xml", "audio", "colgroup", "desc", "foreignobject", "head", "iframe", "math", "mi", "mn", "mo", "ms", "mtext", "noembed", "noframes", "noscript", "plaintext", "script", "style", "svg", "template", "thead", "title", "video", "xmp"]);
  let DATA_URI_TAGS = null;
  const DEFAULT_DATA_URI_TAGS = addToSet({}, ["audio", "video", "img", "source", "image", "track"]);
  let URI_SAFE_ATTRIBUTES = null;
  const DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, ["alt", "class", "for", "id", "label", "name", "pattern", "placeholder", "role", "summary", "title", "value", "style", "xmlns"]);
  const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
  let NAMESPACE = HTML_NAMESPACE;
  let IS_EMPTY_INPUT = false;
  let ALLOWED_NAMESPACES = null;
  const DEFAULT_ALLOWED_NAMESPACES = addToSet({}, [MATHML_NAMESPACE, SVG_NAMESPACE, HTML_NAMESPACE], stringToString);
  let MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, ["mi", "mo", "mn", "ms", "mtext"]);
  let HTML_INTEGRATION_POINTS = addToSet({}, ["annotation-xml"]);
  const COMMON_SVG_AND_HTML_ELEMENTS = addToSet({}, ["title", "style", "font", "a", "script"]);
  let PARSER_MEDIA_TYPE = null;
  const SUPPORTED_PARSER_MEDIA_TYPES = ["application/xhtml+xml", "text/html"];
  const DEFAULT_PARSER_MEDIA_TYPE = "text/html";
  let transformCaseFunc = null;
  let CONFIG = null;
  const formElement = document2.createElement("form");
  const isRegexOrFunction = function isRegexOrFunction2(testValue) {
    return testValue instanceof RegExp || testValue instanceof Function;
  };
  const _parseConfig = function _parseConfig2() {
    let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    if (CONFIG && CONFIG === cfg) {
      return;
    }
    if (!cfg || typeof cfg !== "object") {
      cfg = {};
    }
    cfg = clone(cfg);
    PARSER_MEDIA_TYPE = // eslint-disable-next-line unicorn/prefer-includes
    SUPPORTED_PARSER_MEDIA_TYPES.indexOf(cfg.PARSER_MEDIA_TYPE) === -1 ? DEFAULT_PARSER_MEDIA_TYPE : cfg.PARSER_MEDIA_TYPE;
    transformCaseFunc = PARSER_MEDIA_TYPE === "application/xhtml+xml" ? stringToString : stringToLowerCase;
    ALLOWED_TAGS = objectHasOwnProperty(cfg, "ALLOWED_TAGS") ? addToSet({}, cfg.ALLOWED_TAGS, transformCaseFunc) : DEFAULT_ALLOWED_TAGS;
    ALLOWED_ATTR = objectHasOwnProperty(cfg, "ALLOWED_ATTR") ? addToSet({}, cfg.ALLOWED_ATTR, transformCaseFunc) : DEFAULT_ALLOWED_ATTR;
    ALLOWED_NAMESPACES = objectHasOwnProperty(cfg, "ALLOWED_NAMESPACES") ? addToSet({}, cfg.ALLOWED_NAMESPACES, stringToString) : DEFAULT_ALLOWED_NAMESPACES;
    URI_SAFE_ATTRIBUTES = objectHasOwnProperty(cfg, "ADD_URI_SAFE_ATTR") ? addToSet(clone(DEFAULT_URI_SAFE_ATTRIBUTES), cfg.ADD_URI_SAFE_ATTR, transformCaseFunc) : DEFAULT_URI_SAFE_ATTRIBUTES;
    DATA_URI_TAGS = objectHasOwnProperty(cfg, "ADD_DATA_URI_TAGS") ? addToSet(clone(DEFAULT_DATA_URI_TAGS), cfg.ADD_DATA_URI_TAGS, transformCaseFunc) : DEFAULT_DATA_URI_TAGS;
    FORBID_CONTENTS = objectHasOwnProperty(cfg, "FORBID_CONTENTS") ? addToSet({}, cfg.FORBID_CONTENTS, transformCaseFunc) : DEFAULT_FORBID_CONTENTS;
    FORBID_TAGS = objectHasOwnProperty(cfg, "FORBID_TAGS") ? addToSet({}, cfg.FORBID_TAGS, transformCaseFunc) : clone({});
    FORBID_ATTR = objectHasOwnProperty(cfg, "FORBID_ATTR") ? addToSet({}, cfg.FORBID_ATTR, transformCaseFunc) : clone({});
    USE_PROFILES = objectHasOwnProperty(cfg, "USE_PROFILES") ? cfg.USE_PROFILES : false;
    ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false;
    ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false;
    ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false;
    ALLOW_SELF_CLOSE_IN_ATTR = cfg.ALLOW_SELF_CLOSE_IN_ATTR !== false;
    SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false;
    SAFE_FOR_XML = cfg.SAFE_FOR_XML !== false;
    WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false;
    RETURN_DOM = cfg.RETURN_DOM || false;
    RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false;
    RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false;
    FORCE_BODY = cfg.FORCE_BODY || false;
    SANITIZE_DOM = cfg.SANITIZE_DOM !== false;
    SANITIZE_NAMED_PROPS = cfg.SANITIZE_NAMED_PROPS || false;
    KEEP_CONTENT = cfg.KEEP_CONTENT !== false;
    IN_PLACE = cfg.IN_PLACE || false;
    IS_ALLOWED_URI$1 = cfg.ALLOWED_URI_REGEXP || IS_ALLOWED_URI;
    NAMESPACE = cfg.NAMESPACE || HTML_NAMESPACE;
    MATHML_TEXT_INTEGRATION_POINTS = cfg.MATHML_TEXT_INTEGRATION_POINTS || MATHML_TEXT_INTEGRATION_POINTS;
    HTML_INTEGRATION_POINTS = cfg.HTML_INTEGRATION_POINTS || HTML_INTEGRATION_POINTS;
    CUSTOM_ELEMENT_HANDLING = cfg.CUSTOM_ELEMENT_HANDLING || {};
    if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck)) {
      CUSTOM_ELEMENT_HANDLING.tagNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck;
    }
    if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck)) {
      CUSTOM_ELEMENT_HANDLING.attributeNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck;
    }
    if (cfg.CUSTOM_ELEMENT_HANDLING && typeof cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements === "boolean") {
      CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements = cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements;
    }
    if (SAFE_FOR_TEMPLATES) {
      ALLOW_DATA_ATTR = false;
    }
    if (RETURN_DOM_FRAGMENT) {
      RETURN_DOM = true;
    }
    if (USE_PROFILES) {
      ALLOWED_TAGS = addToSet({}, text);
      ALLOWED_ATTR = [];
      if (USE_PROFILES.html === true) {
        addToSet(ALLOWED_TAGS, html$1);
        addToSet(ALLOWED_ATTR, html);
      }
      if (USE_PROFILES.svg === true) {
        addToSet(ALLOWED_TAGS, svg$1);
        addToSet(ALLOWED_ATTR, svg);
        addToSet(ALLOWED_ATTR, xml);
      }
      if (USE_PROFILES.svgFilters === true) {
        addToSet(ALLOWED_TAGS, svgFilters);
        addToSet(ALLOWED_ATTR, svg);
        addToSet(ALLOWED_ATTR, xml);
      }
      if (USE_PROFILES.mathMl === true) {
        addToSet(ALLOWED_TAGS, mathMl$1);
        addToSet(ALLOWED_ATTR, mathMl);
        addToSet(ALLOWED_ATTR, xml);
      }
    }
    if (cfg.ADD_TAGS) {
      if (typeof cfg.ADD_TAGS === "function") {
        EXTRA_ELEMENT_HANDLING.tagCheck = cfg.ADD_TAGS;
      } else {
        if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) {
          ALLOWED_TAGS = clone(ALLOWED_TAGS);
        }
        addToSet(ALLOWED_TAGS, cfg.ADD_TAGS, transformCaseFunc);
      }
    }
    if (cfg.ADD_ATTR) {
      if (typeof cfg.ADD_ATTR === "function") {
        EXTRA_ELEMENT_HANDLING.attributeCheck = cfg.ADD_ATTR;
      } else {
        if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) {
          ALLOWED_ATTR = clone(ALLOWED_ATTR);
        }
        addToSet(ALLOWED_ATTR, cfg.ADD_ATTR, transformCaseFunc);
      }
    }
    if (cfg.ADD_URI_SAFE_ATTR) {
      addToSet(URI_SAFE_ATTRIBUTES, cfg.ADD_URI_SAFE_ATTR, transformCaseFunc);
    }
    if (cfg.FORBID_CONTENTS) {
      if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
        FORBID_CONTENTS = clone(FORBID_CONTENTS);
      }
      addToSet(FORBID_CONTENTS, cfg.FORBID_CONTENTS, transformCaseFunc);
    }
    if (cfg.ADD_FORBID_CONTENTS) {
      if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
        FORBID_CONTENTS = clone(FORBID_CONTENTS);
      }
      addToSet(FORBID_CONTENTS, cfg.ADD_FORBID_CONTENTS, transformCaseFunc);
    }
    if (KEEP_CONTENT) {
      ALLOWED_TAGS["#text"] = true;
    }
    if (WHOLE_DOCUMENT) {
      addToSet(ALLOWED_TAGS, ["html", "head", "body"]);
    }
    if (ALLOWED_TAGS.table) {
      addToSet(ALLOWED_TAGS, ["tbody"]);
      delete FORBID_TAGS.tbody;
    }
    if (cfg.TRUSTED_TYPES_POLICY) {
      if (typeof cfg.TRUSTED_TYPES_POLICY.createHTML !== "function") {
        throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
      }
      if (typeof cfg.TRUSTED_TYPES_POLICY.createScriptURL !== "function") {
        throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
      }
      trustedTypesPolicy = cfg.TRUSTED_TYPES_POLICY;
      emptyHTML = trustedTypesPolicy.createHTML("");
    } else {
      if (trustedTypesPolicy === void 0) {
        trustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, currentScript);
      }
      if (trustedTypesPolicy !== null && typeof emptyHTML === "string") {
        emptyHTML = trustedTypesPolicy.createHTML("");
      }
    }
    if (freeze) {
      freeze(cfg);
    }
    CONFIG = cfg;
  };
  const ALL_SVG_TAGS = addToSet({}, [...svg$1, ...svgFilters, ...svgDisallowed]);
  const ALL_MATHML_TAGS = addToSet({}, [...mathMl$1, ...mathMlDisallowed]);
  const _checkValidNamespace = function _checkValidNamespace2(element) {
    let parent = getParentNode(element);
    if (!parent || !parent.tagName) {
      parent = {
        namespaceURI: NAMESPACE,
        tagName: "template"
      };
    }
    const tagName = stringToLowerCase(element.tagName);
    const parentTagName = stringToLowerCase(parent.tagName);
    if (!ALLOWED_NAMESPACES[element.namespaceURI]) {
      return false;
    }
    if (element.namespaceURI === SVG_NAMESPACE) {
      if (parent.namespaceURI === HTML_NAMESPACE) {
        return tagName === "svg";
      }
      if (parent.namespaceURI === MATHML_NAMESPACE) {
        return tagName === "svg" && (parentTagName === "annotation-xml" || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
      }
      return Boolean(ALL_SVG_TAGS[tagName]);
    }
    if (element.namespaceURI === MATHML_NAMESPACE) {
      if (parent.namespaceURI === HTML_NAMESPACE) {
        return tagName === "math";
      }
      if (parent.namespaceURI === SVG_NAMESPACE) {
        return tagName === "math" && HTML_INTEGRATION_POINTS[parentTagName];
      }
      return Boolean(ALL_MATHML_TAGS[tagName]);
    }
    if (element.namespaceURI === HTML_NAMESPACE) {
      if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) {
        return false;
      }
      if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) {
        return false;
      }
      return !ALL_MATHML_TAGS[tagName] && (COMMON_SVG_AND_HTML_ELEMENTS[tagName] || !ALL_SVG_TAGS[tagName]);
    }
    if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && ALLOWED_NAMESPACES[element.namespaceURI]) {
      return true;
    }
    return false;
  };
  const _forceRemove = function _forceRemove2(node) {
    arrayPush(DOMPurify.removed, {
      element: node
    });
    try {
      getParentNode(node).removeChild(node);
    } catch (_) {
      remove(node);
    }
  };
  const _removeAttribute = function _removeAttribute2(name, element) {
    try {
      arrayPush(DOMPurify.removed, {
        attribute: element.getAttributeNode(name),
        from: element
      });
    } catch (_) {
      arrayPush(DOMPurify.removed, {
        attribute: null,
        from: element
      });
    }
    element.removeAttribute(name);
    if (name === "is") {
      if (RETURN_DOM || RETURN_DOM_FRAGMENT) {
        try {
          _forceRemove(element);
        } catch (_) {
        }
      } else {
        try {
          element.setAttribute(name, "");
        } catch (_) {
        }
      }
    }
  };
  const _initDocument = function _initDocument2(dirty) {
    let doc = null;
    let leadingWhitespace = null;
    if (FORCE_BODY) {
      dirty = "<remove></remove>" + dirty;
    } else {
      const matches = stringMatch(dirty, /^[\r\n\t ]+/);
      leadingWhitespace = matches && matches[0];
    }
    if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && NAMESPACE === HTML_NAMESPACE) {
      dirty = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + dirty + "</body></html>";
    }
    const dirtyPayload = trustedTypesPolicy ? trustedTypesPolicy.createHTML(dirty) : dirty;
    if (NAMESPACE === HTML_NAMESPACE) {
      try {
        doc = new DOMParser2().parseFromString(dirtyPayload, PARSER_MEDIA_TYPE);
      } catch (_) {
      }
    }
    if (!doc || !doc.documentElement) {
      doc = implementation.createDocument(NAMESPACE, "template", null);
      try {
        doc.documentElement.innerHTML = IS_EMPTY_INPUT ? emptyHTML : dirtyPayload;
      } catch (_) {
      }
    }
    const body = doc.body || doc.documentElement;
    if (dirty && leadingWhitespace) {
      body.insertBefore(document2.createTextNode(leadingWhitespace), body.childNodes[0] || null);
    }
    if (NAMESPACE === HTML_NAMESPACE) {
      return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? "html" : "body")[0];
    }
    return WHOLE_DOCUMENT ? doc.documentElement : body;
  };
  const _createNodeIterator = function _createNodeIterator2(root) {
    return createNodeIterator.call(
      root.ownerDocument || root,
      root,
      // eslint-disable-next-line no-bitwise
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_PROCESSING_INSTRUCTION | NodeFilter.SHOW_CDATA_SECTION,
      null
    );
  };
  const _isClobbered = function _isClobbered2(element) {
    return element instanceof HTMLFormElement && (typeof element.nodeName !== "string" || typeof element.textContent !== "string" || typeof element.removeChild !== "function" || !(element.attributes instanceof NamedNodeMap) || typeof element.removeAttribute !== "function" || typeof element.setAttribute !== "function" || typeof element.namespaceURI !== "string" || typeof element.insertBefore !== "function" || typeof element.hasChildNodes !== "function");
  };
  const _isNode = function _isNode2(value) {
    return typeof Node === "function" && value instanceof Node;
  };
  function _executeHooks(hooks2, currentNode, data) {
    arrayForEach(hooks2, (hook) => {
      hook.call(DOMPurify, currentNode, data, CONFIG);
    });
  }
  const _sanitizeElements = function _sanitizeElements2(currentNode) {
    let content = null;
    _executeHooks(hooks.beforeSanitizeElements, currentNode, null);
    if (_isClobbered(currentNode)) {
      _forceRemove(currentNode);
      return true;
    }
    const tagName = transformCaseFunc(currentNode.nodeName);
    _executeHooks(hooks.uponSanitizeElement, currentNode, {
      tagName,
      allowedTags: ALLOWED_TAGS
    });
    if (SAFE_FOR_XML && currentNode.hasChildNodes() && !_isNode(currentNode.firstElementChild) && regExpTest(/<[/\w!]/g, currentNode.innerHTML) && regExpTest(/<[/\w!]/g, currentNode.textContent)) {
      _forceRemove(currentNode);
      return true;
    }
    if (currentNode.nodeType === NODE_TYPE.progressingInstruction) {
      _forceRemove(currentNode);
      return true;
    }
    if (SAFE_FOR_XML && currentNode.nodeType === NODE_TYPE.comment && regExpTest(/<[/\w]/g, currentNode.data)) {
      _forceRemove(currentNode);
      return true;
    }
    if (!(EXTRA_ELEMENT_HANDLING.tagCheck instanceof Function && EXTRA_ELEMENT_HANDLING.tagCheck(tagName)) && (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName])) {
      if (!FORBID_TAGS[tagName] && _isBasicCustomElement(tagName)) {
        if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, tagName)) {
          return false;
        }
        if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(tagName)) {
          return false;
        }
      }
      if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
        const parentNode = getParentNode(currentNode) || currentNode.parentNode;
        const childNodes = getChildNodes(currentNode) || currentNode.childNodes;
        if (childNodes && parentNode) {
          const childCount = childNodes.length;
          for (let i = childCount - 1; i >= 0; --i) {
            const childClone = cloneNode(childNodes[i], true);
            childClone.__removalCount = (currentNode.__removalCount || 0) + 1;
            parentNode.insertBefore(childClone, getNextSibling(currentNode));
          }
        }
      }
      _forceRemove(currentNode);
      return true;
    }
    if (currentNode instanceof Element2 && !_checkValidNamespace(currentNode)) {
      _forceRemove(currentNode);
      return true;
    }
    if ((tagName === "noscript" || tagName === "noembed" || tagName === "noframes") && regExpTest(/<\/no(script|embed|frames)/i, currentNode.innerHTML)) {
      _forceRemove(currentNode);
      return true;
    }
    if (SAFE_FOR_TEMPLATES && currentNode.nodeType === NODE_TYPE.text) {
      content = currentNode.textContent;
      arrayForEach([MUSTACHE_EXPR2, ERB_EXPR2, TMPLIT_EXPR2], (expr) => {
        content = stringReplace(content, expr, " ");
      });
      if (currentNode.textContent !== content) {
        arrayPush(DOMPurify.removed, {
          element: currentNode.cloneNode()
        });
        currentNode.textContent = content;
      }
    }
    _executeHooks(hooks.afterSanitizeElements, currentNode, null);
    return false;
  };
  const _isValidAttribute = function _isValidAttribute2(lcTag, lcName, value) {
    if (SANITIZE_DOM && (lcName === "id" || lcName === "name") && (value in document2 || value in formElement)) {
      return false;
    }
    if (ALLOW_DATA_ATTR && !FORBID_ATTR[lcName] && regExpTest(DATA_ATTR2, lcName)) ;
    else if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR2, lcName)) ;
    else if (EXTRA_ELEMENT_HANDLING.attributeCheck instanceof Function && EXTRA_ELEMENT_HANDLING.attributeCheck(lcName, lcTag)) ;
    else if (!ALLOWED_ATTR[lcName] || FORBID_ATTR[lcName]) {
      if (
        // First condition does a very basic check if a) it's basically a valid custom element tagname AND
        // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
        // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
        _isBasicCustomElement(lcTag) && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, lcTag) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(lcTag)) && (CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.attributeNameCheck, lcName) || CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.attributeNameCheck(lcName, lcTag)) || // Alternative, second condition checks if it's an `is`-attribute, AND
        // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
        lcName === "is" && CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, value) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(value))
      ) ;
      else {
        return false;
      }
    } else if (URI_SAFE_ATTRIBUTES[lcName]) ;
    else if (regExpTest(IS_ALLOWED_URI$1, stringReplace(value, ATTR_WHITESPACE2, ""))) ;
    else if ((lcName === "src" || lcName === "xlink:href" || lcName === "href") && lcTag !== "script" && stringIndexOf(value, "data:") === 0 && DATA_URI_TAGS[lcTag]) ;
    else if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA2, stringReplace(value, ATTR_WHITESPACE2, ""))) ;
    else if (value) {
      return false;
    } else ;
    return true;
  };
  const _isBasicCustomElement = function _isBasicCustomElement2(tagName) {
    return tagName !== "annotation-xml" && stringMatch(tagName, CUSTOM_ELEMENT2);
  };
  const _sanitizeAttributes = function _sanitizeAttributes2(currentNode) {
    _executeHooks(hooks.beforeSanitizeAttributes, currentNode, null);
    const {
      attributes
    } = currentNode;
    if (!attributes || _isClobbered(currentNode)) {
      return;
    }
    const hookEvent = {
      attrName: "",
      attrValue: "",
      keepAttr: true,
      allowedAttributes: ALLOWED_ATTR,
      forceKeepAttr: void 0
    };
    let l = attributes.length;
    while (l--) {
      const attr = attributes[l];
      const {
        name,
        namespaceURI,
        value: attrValue
      } = attr;
      const lcName = transformCaseFunc(name);
      const initValue = attrValue;
      let value = name === "value" ? initValue : stringTrim(initValue);
      hookEvent.attrName = lcName;
      hookEvent.attrValue = value;
      hookEvent.keepAttr = true;
      hookEvent.forceKeepAttr = void 0;
      _executeHooks(hooks.uponSanitizeAttribute, currentNode, hookEvent);
      value = hookEvent.attrValue;
      if (SANITIZE_NAMED_PROPS && (lcName === "id" || lcName === "name")) {
        _removeAttribute(name, currentNode);
        value = SANITIZE_NAMED_PROPS_PREFIX + value;
      }
      if (SAFE_FOR_XML && regExpTest(/((--!?|])>)|<\/(style|title|textarea)/i, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (lcName === "attributename" && stringMatch(value, "href")) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (hookEvent.forceKeepAttr) {
        continue;
      }
      if (!hookEvent.keepAttr) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (!ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(/\/>/i, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (SAFE_FOR_TEMPLATES) {
        arrayForEach([MUSTACHE_EXPR2, ERB_EXPR2, TMPLIT_EXPR2], (expr) => {
          value = stringReplace(value, expr, " ");
        });
      }
      const lcTag = transformCaseFunc(currentNode.nodeName);
      if (!_isValidAttribute(lcTag, lcName, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (trustedTypesPolicy && typeof trustedTypes === "object" && typeof trustedTypes.getAttributeType === "function") {
        if (namespaceURI) ;
        else {
          switch (trustedTypes.getAttributeType(lcTag, lcName)) {
            case "TrustedHTML": {
              value = trustedTypesPolicy.createHTML(value);
              break;
            }
            case "TrustedScriptURL": {
              value = trustedTypesPolicy.createScriptURL(value);
              break;
            }
          }
        }
      }
      if (value !== initValue) {
        try {
          if (namespaceURI) {
            currentNode.setAttributeNS(namespaceURI, name, value);
          } else {
            currentNode.setAttribute(name, value);
          }
          if (_isClobbered(currentNode)) {
            _forceRemove(currentNode);
          } else {
            arrayPop(DOMPurify.removed);
          }
        } catch (_) {
          _removeAttribute(name, currentNode);
        }
      }
    }
    _executeHooks(hooks.afterSanitizeAttributes, currentNode, null);
  };
  const _sanitizeShadowDOM = function _sanitizeShadowDOM2(fragment) {
    let shadowNode = null;
    const shadowIterator = _createNodeIterator(fragment);
    _executeHooks(hooks.beforeSanitizeShadowDOM, fragment, null);
    while (shadowNode = shadowIterator.nextNode()) {
      _executeHooks(hooks.uponSanitizeShadowNode, shadowNode, null);
      _sanitizeElements(shadowNode);
      _sanitizeAttributes(shadowNode);
      if (shadowNode.content instanceof DocumentFragment) {
        _sanitizeShadowDOM2(shadowNode.content);
      }
    }
    _executeHooks(hooks.afterSanitizeShadowDOM, fragment, null);
  };
  DOMPurify.sanitize = function(dirty) {
    let cfg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    let body = null;
    let importedNode = null;
    let currentNode = null;
    let returnNode = null;
    IS_EMPTY_INPUT = !dirty;
    if (IS_EMPTY_INPUT) {
      dirty = "<!-->";
    }
    if (typeof dirty !== "string" && !_isNode(dirty)) {
      if (typeof dirty.toString === "function") {
        dirty = dirty.toString();
        if (typeof dirty !== "string") {
          throw typeErrorCreate("dirty is not a string, aborting");
        }
      } else {
        throw typeErrorCreate("toString is not a function");
      }
    }
    if (!DOMPurify.isSupported) {
      return dirty;
    }
    if (!SET_CONFIG) {
      _parseConfig(cfg);
    }
    DOMPurify.removed = [];
    if (typeof dirty === "string") {
      IN_PLACE = false;
    }
    if (IN_PLACE) {
      if (dirty.nodeName) {
        const tagName = transformCaseFunc(dirty.nodeName);
        if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
          throw typeErrorCreate("root node is forbidden and cannot be sanitized in-place");
        }
      }
    } else if (dirty instanceof Node) {
      body = _initDocument("<!---->");
      importedNode = body.ownerDocument.importNode(dirty, true);
      if (importedNode.nodeType === NODE_TYPE.element && importedNode.nodeName === "BODY") {
        body = importedNode;
      } else if (importedNode.nodeName === "HTML") {
        body = importedNode;
      } else {
        body.appendChild(importedNode);
      }
    } else {
      if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT && // eslint-disable-next-line unicorn/prefer-includes
      dirty.indexOf("<") === -1) {
        return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(dirty) : dirty;
      }
      body = _initDocument(dirty);
      if (!body) {
        return RETURN_DOM ? null : RETURN_TRUSTED_TYPE ? emptyHTML : "";
      }
    }
    if (body && FORCE_BODY) {
      _forceRemove(body.firstChild);
    }
    const nodeIterator = _createNodeIterator(IN_PLACE ? dirty : body);
    while (currentNode = nodeIterator.nextNode()) {
      _sanitizeElements(currentNode);
      _sanitizeAttributes(currentNode);
      if (currentNode.content instanceof DocumentFragment) {
        _sanitizeShadowDOM(currentNode.content);
      }
    }
    if (IN_PLACE) {
      return dirty;
    }
    if (RETURN_DOM) {
      if (RETURN_DOM_FRAGMENT) {
        returnNode = createDocumentFragment.call(body.ownerDocument);
        while (body.firstChild) {
          returnNode.appendChild(body.firstChild);
        }
      } else {
        returnNode = body;
      }
      if (ALLOWED_ATTR.shadowroot || ALLOWED_ATTR.shadowrootmode) {
        returnNode = importNode.call(originalDocument, returnNode, true);
      }
      return returnNode;
    }
    let serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
    if (WHOLE_DOCUMENT && ALLOWED_TAGS["!doctype"] && body.ownerDocument && body.ownerDocument.doctype && body.ownerDocument.doctype.name && regExpTest(DOCTYPE_NAME, body.ownerDocument.doctype.name)) {
      serializedHTML = "<!DOCTYPE " + body.ownerDocument.doctype.name + ">\n" + serializedHTML;
    }
    if (SAFE_FOR_TEMPLATES) {
      arrayForEach([MUSTACHE_EXPR2, ERB_EXPR2, TMPLIT_EXPR2], (expr) => {
        serializedHTML = stringReplace(serializedHTML, expr, " ");
      });
    }
    return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(serializedHTML) : serializedHTML;
  };
  DOMPurify.setConfig = function() {
    let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    _parseConfig(cfg);
    SET_CONFIG = true;
  };
  DOMPurify.clearConfig = function() {
    CONFIG = null;
    SET_CONFIG = false;
  };
  DOMPurify.isValidAttribute = function(tag, attr, value) {
    if (!CONFIG) {
      _parseConfig({});
    }
    const lcTag = transformCaseFunc(tag);
    const lcName = transformCaseFunc(attr);
    return _isValidAttribute(lcTag, lcName, value);
  };
  DOMPurify.addHook = function(entryPoint, hookFunction) {
    if (typeof hookFunction !== "function") {
      return;
    }
    arrayPush(hooks[entryPoint], hookFunction);
  };
  DOMPurify.removeHook = function(entryPoint, hookFunction) {
    if (hookFunction !== void 0) {
      const index = arrayLastIndexOf(hooks[entryPoint], hookFunction);
      return index === -1 ? void 0 : arraySplice(hooks[entryPoint], index, 1)[0];
    }
    return arrayPop(hooks[entryPoint]);
  };
  DOMPurify.removeHooks = function(entryPoint) {
    hooks[entryPoint] = [];
  };
  DOMPurify.removeAllHooks = function() {
    hooks = _createHooksMap();
  };
  return DOMPurify;
}
var purify = createDOMPurify();

// src/card/data/sanitize.ts
function escapeHtml(text2) {
  return text2.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
var DOMPURIFY_CONFIG = {
  USE_PROFILES: { html: true, svg: true, svgFilters: true },
  ADD_ATTR: [
    "data-node-id",
    "data-action",
    "data-tab",
    "data-edge",
    "data-edge-left",
    "data-edge-right",
    "data-entity-id",
    "data-copy-value",
    "data-context-action",
    "data-context-node",
    "data-mac",
    "data-modal-overlay",
    "data-modal-entity-id"
  ]
};
function sanitizeHtml(markup) {
  return purify.sanitize(markup, DOMPURIFY_CONFIG);
}
function sanitizeSvg(svg2) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg2, "image/svg+xml");
  const svgElement = doc.querySelector("svg");
  if (!svgElement) {
    return "";
  }
  const dangerousElements = svgElement.querySelectorAll("script, foreignObject");
  dangerousElements.forEach((el) => el.remove());
  const allElements = svgElement.querySelectorAll("*");
  const eventAttrs = /^on[a-z]+$/i;
  allElements.forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (eventAttrs.test(attr.name)) {
        el.removeAttribute(attr.name);
      }
      if (attr.value.toLowerCase().includes("javascript:")) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return svgElement.outerHTML;
}

// src/card/data/svg.ts
function annotateEdges(svg2, edges) {
  const edgesByKey = buildEdgeLookup(edges);
  const paths = svg2.querySelectorAll("path[data-edge-left][data-edge-right]");
  paths.forEach((path) => {
    const left = path.getAttribute("data-edge-left");
    const right = path.getAttribute("data-edge-right");
    if (!left || !right) return;
    const edge = edgesByKey.get(edgeKey(left, right));
    if (!edge) return;
    path.setAttribute("data-edge", "true");
    ensureEdgeHitbox(path, edge);
  });
}
function findEdgeFromTarget(target, edges) {
  if (!target) return null;
  const edgePath = target.closest("path[data-edge], path[data-edge-hitbox]");
  if (!edgePath) return null;
  const left = edgePath.getAttribute("data-edge-left");
  const right = edgePath.getAttribute("data-edge-right");
  if (!left || !right) return null;
  const lookup = buildEdgeLookup(edges);
  return lookup.get(edgeKey(left, right)) ?? null;
}
function renderEdgeTooltip(edge) {
  const connectionType = edge.wireless ? "Wireless" : "Wired";
  const icon = edge.wireless ? "\u{1F4F6}" : "\u{1F517}";
  const rows = [];
  rows.push(
    `<div class="tooltip-edge__title">${escapeHtml(edge.left)} \u2194 ${escapeHtml(edge.right)}</div>`
  );
  rows.push(
    `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">${icon}</span><span class="tooltip-edge__label">${connectionType}</span></div>`
  );
  if (edge.label) {
    rows.push(
      `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">\u{1F50C}</span><span class="tooltip-edge__label">${escapeHtml(edge.label)}</span></div>`
    );
  }
  if (edge.poe) {
    rows.push(
      `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">\u26A1</span><span class="tooltip-edge__label">PoE Powered</span></div>`
    );
  }
  if (edge.speed) {
    rows.push(
      `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">\u{1F680}</span><span class="tooltip-edge__label">${formatSpeed(edge.speed)}</span></div>`
    );
  }
  if (edge.channel) {
    rows.push(
      `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">\u{1F4E1}</span><span class="tooltip-edge__label">${formatChannel(edge.channel)}</span></div>`
    );
  }
  return rows.join("");
}
function buildEdgeLookup(edges) {
  const map = /* @__PURE__ */ new Map();
  edges.forEach((edge) => {
    map.set(edgeKey(edge.left, edge.right), edge);
  });
  return map;
}
function edgeKey(left, right) {
  return [left.trim(), right.trim()].sort().join("|");
}
function ensureEdgeHitbox(path, edge) {
  const next = path.nextElementSibling;
  if (next?.getAttribute("data-edge-hitbox") === "true") {
    return;
  }
  const hitbox = path.cloneNode(false);
  hitbox.setAttribute("data-edge-hitbox", "true");
  hitbox.setAttribute("data-edge-left", edge.left);
  hitbox.setAttribute("data-edge-right", edge.right);
  hitbox.setAttribute("stroke", "transparent");
  hitbox.setAttribute("fill", "none");
  path.after(hitbox);
}
function formatSpeed(speedMbps) {
  if (speedMbps >= 1e3) {
    const gbps = (speedMbps / 1e3).toFixed(1).replace(/\.0$/, "");
    return `${gbps} Gbps`;
  }
  return `${speedMbps} Mbps`;
}
function formatChannel(channel) {
  const band = channelBand(channel);
  const suffix = band ? ` (${band})` : "";
  return `Channel ${channel}${suffix}`;
}
function channelBand(channel) {
  if (channel >= 1 && channel <= 14) {
    return "2.4GHz";
  }
  if (channel >= 36 && channel <= 177) {
    return "5GHz";
  }
  if (channel >= 1) {
    return "6GHz";
  }
  return null;
}

// src/card/interaction/node.ts
function resolveNodeName(event) {
  const path = event.composedPath();
  for (const item of path) {
    if (item instanceof Element) {
      const nodeId = item.getAttribute("data-node-id");
      if (nodeId) {
        return nodeId.trim();
      }
      const aria = item.getAttribute("aria-label");
      if (aria) {
        return aria.trim();
      }
      if (item.tagName.toLowerCase() === "text" && item.textContent) {
        return item.textContent.trim();
      }
      if (item.tagName.toLowerCase() === "title" && item.textContent) {
        return item.textContent.trim();
      }
    }
  }
  const fallback = document.elementFromPoint(event.clientX, event.clientY);
  return inferNodeName(fallback);
}
function inferNodeName(target) {
  if (!target) {
    return null;
  }
  const node = target.closest("[data-node-id]");
  if (node?.getAttribute("data-node-id")) {
    return node.getAttribute("data-node-id")?.trim() ?? null;
  }
  const labelled = target.closest("[aria-label]");
  if (labelled?.getAttribute("aria-label")) {
    return labelled.getAttribute("aria-label")?.trim() ?? null;
  }
  const textNode = target.closest("text");
  if (textNode?.textContent) {
    return textNode.textContent.trim();
  }
  const group = target.closest("g");
  const title = group?.querySelector("title");
  if (title?.textContent) {
    return title.textContent.trim();
  }
  const groupText = group?.querySelector("text");
  if (groupText?.textContent) {
    return groupText.textContent.trim();
  }
  const idHolder = target.closest("[id]");
  if (idHolder?.getAttribute("id")) {
    return idHolder.getAttribute("id")?.trim() ?? null;
  }
  return null;
}
function findNodeElement(svg2, nodeName) {
  return findByDataNodeId(svg2, nodeName) ?? findByAriaLabel(svg2, nodeName) ?? findByTextContent(svg2, nodeName) ?? findByTitleElement(svg2, nodeName);
}
function highlightSelectedNode(svg2, selectedNode) {
  clearNodeSelection(svg2);
  if (!selectedNode) {
    return;
  }
  const element = findNodeElement(svg2, selectedNode);
  if (element) {
    markNodeSelected(element);
  }
}
function clearNodeSelection(svg2) {
  svg2.querySelectorAll("[data-selected]").forEach((el) => {
    el.removeAttribute("data-selected");
  });
  svg2.querySelectorAll(".node--selected").forEach((el) => {
    el.classList.remove("node--selected");
  });
}
function markNodeSelected(element) {
  if (element.tagName.toLowerCase() === "g") {
    element.setAttribute("data-selected", "true");
  } else {
    element.classList.add("node--selected");
  }
}
function annotateNodeIds(svg2, nodeNames) {
  if (!nodeNames.length) {
    return;
  }
  const textMap = buildTextMap(svg2, "text");
  const titleMap = buildTextMap(svg2, "title");
  for (const name of nodeNames) {
    if (!name) continue;
    if (svg2.querySelector(`[data-node-id="${CSS.escape(name)}"]`)) {
      continue;
    }
    const ariaMatch = svg2.querySelector(`[aria-label="${CSS.escape(name)}"]`);
    const textMatch = textMap.get(name)?.[0] ?? null;
    const titleMatch = titleMap.get(name)?.[0] ?? null;
    const target = ariaMatch ?? textMatch ?? titleMatch;
    if (!target) {
      continue;
    }
    const holder = target.closest("g") ?? target;
    holder.setAttribute("data-node-id", name);
  }
}
function buildTextMap(svg2, selector) {
  const map = /* @__PURE__ */ new Map();
  for (const el of svg2.querySelectorAll(selector)) {
    const text2 = el.textContent?.trim();
    if (!text2) continue;
    const list = map.get(text2) ?? [];
    list.push(el);
    map.set(text2, list);
  }
  return map;
}
function findByDataNodeId(svg2, nodeName) {
  const el = svg2.querySelector(`[data-node-id="${CSS.escape(nodeName)}"]`);
  return el ? el.closest("g") ?? el : null;
}
function findByAriaLabel(svg2, nodeName) {
  const el = svg2.querySelector(`[aria-label="${CSS.escape(nodeName)}"]`);
  return el ? el.closest("g") ?? el : null;
}
function findByTextContent(svg2, nodeName) {
  for (const textEl of svg2.querySelectorAll("text")) {
    if (textEl.textContent?.trim() === nodeName) {
      return textEl.closest("g") ?? textEl;
    }
  }
  return null;
}
function findByTitleElement(svg2, nodeName) {
  for (const titleEl of svg2.querySelectorAll("title")) {
    if (titleEl.textContent?.trim() === nodeName) {
      return titleEl.closest("g");
    }
  }
  return null;
}

// src/card/ui/entity-modal.ts
function renderEntityModal(context) {
  const safeName = escapeHtml(context.nodeName);
  const mac = context.payload?.client_macs?.[context.nodeName] ?? context.payload?.device_macs?.[context.nodeName];
  const nodeType = context.payload?.node_types?.[context.nodeName] ?? "unknown";
  const status = context.payload?.node_status?.[context.nodeName];
  const relatedEntities = context.payload?.related_entities?.[context.nodeName] ?? [];
  const typeIcon = context.getNodeTypeIcon(nodeType);
  const infoRows = [];
  if (mac) {
    infoRows.push(`
      <div class="entity-modal__info-row">
        <span class="entity-modal__info-label">MAC Address</span>
        <span class="entity-modal__info-value">${escapeHtml(mac)}</span>
      </div>
    `);
  }
  const ipEntity = relatedEntities.find((entity) => entity.ip);
  if (ipEntity?.ip) {
    infoRows.push(`
      <div class="entity-modal__info-row">
        <span class="entity-modal__info-label">IP Address</span>
        <span class="entity-modal__info-value">${escapeHtml(ipEntity.ip)}</span>
      </div>
    `);
  }
  if (status?.state) {
    const stateDisplay = status.state === "online" ? "Online" : status.state === "offline" ? "Offline" : "Unknown";
    infoRows.push(`
      <div class="entity-modal__info-row">
        <span class="entity-modal__info-label">Status</span>
        <span class="entity-modal__info-value">${stateDisplay}</span>
      </div>
    `);
  }
  if (status?.last_changed) {
    infoRows.push(`
      <div class="entity-modal__info-row">
        <span class="entity-modal__info-label">Last Changed</span>
        <span class="entity-modal__info-value">${context.formatLastChanged(status.last_changed)}</span>
      </div>
    `);
  }
  infoRows.push(`
    <div class="entity-modal__info-row">
      <span class="entity-modal__info-label">Device Type</span>
      <span class="entity-modal__info-value">${escapeHtml(nodeType)}</span>
    </div>
  `);
  const entityItems = relatedEntities.map((entity) => renderEntityItem(entity)).join("");
  return `
    <div class="entity-modal-overlay" data-modal-overlay data-theme="${escapeHtml(context.theme)}">
      <div class="entity-modal">
        <div class="entity-modal__header">
          <div class="entity-modal__title">
            <span>${typeIcon}</span>
            <span>${safeName}</span>
          </div>
          <button type="button" class="entity-modal__close" data-action="close-modal">&times;</button>
        </div>
        <div class="entity-modal__body">
          <div class="entity-modal__section">
            <div class="entity-modal__section-title">Device Information</div>
            <div class="entity-modal__info-grid">
              ${infoRows.join("")}
            </div>
          </div>
          ${relatedEntities.length > 0 ? `
            <div class="entity-modal__section">
              <div class="entity-modal__section-title">Related Entities (${relatedEntities.length})</div>
              <div class="entity-modal__entity-list">
                ${entityItems}
              </div>
            </div>
          ` : `
            <div class="entity-modal__section">
              <div class="entity-modal__section-title">Related Entities</div>
              <div class="panel-empty__text">No Home Assistant entities found for this device</div>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}
function renderEntityItem(entity) {
  const domainIcon = getDomainIcon(entity.domain);
  const displayName = entity.friendly_name ?? entity.entity_id;
  const safeDisplayName = escapeHtml(displayName);
  const safeEntityId = escapeHtml(entity.entity_id);
  const state = entity.state ?? "unavailable";
  const stateClass = getStateBadgeClass(state);
  return `
    <div class="entity-modal__entity-item" data-modal-entity-id="${safeEntityId}">
      <span class="entity-modal__domain-icon">${domainIcon}</span>
      <div class="entity-modal__entity-info">
        <span class="entity-modal__entity-name">${safeDisplayName}</span>
        <span class="entity-modal__entity-id">${safeEntityId}</span>
      </div>
      <div class="entity-modal__entity-state">
        <span class="entity-modal__state-badge ${stateClass}">${escapeHtml(state)}</span>
        <span class="entity-modal__arrow">\u203A</span>
      </div>
    </div>
  `;
}
function getDomainIcon(domain) {
  const icons = {
    device_tracker: "\u{1F4CD}",
    switch: "\u{1F518}",
    sensor: "\u{1F4CA}",
    binary_sensor: "\u26A1",
    light: "\u{1F4A1}",
    button: "\u{1F532}",
    update: "\u{1F504}",
    image: "\u{1F5BC}\uFE0F"
  };
  return icons[domain] ?? "\u{1F4E6}";
}
function getStateBadgeClass(state) {
  if (state === "home" || state === "on") {
    return `entity-modal__state-badge--${state}`;
  }
  if (state === "not_home" || state === "off") {
    return `entity-modal__state-badge--${state}`;
  }
  return "entity-modal__state-badge--default";
}

// src/card/interaction/entity-modal-state.ts
function createEntityModalController() {
  return {};
}
function openEntityModal(params) {
  closeEntityModal(params.controller);
  const modalHtml = renderEntityModal({
    nodeName: params.nodeName,
    payload: params.payload,
    theme: params.theme,
    getNodeTypeIcon: params.getNodeTypeIcon,
    formatLastChanged: params.formatLastChanged
  });
  const container = document.createElement("div");
  container.innerHTML = modalHtml;
  const overlay = container.firstElementChild;
  if (!overlay) {
    return;
  }
  document.body.appendChild(overlay);
  params.controller.overlay = overlay;
  wireEntityModalEvents(overlay, () => closeEntityModal(params.controller), params.onEntityDetails);
}
function closeEntityModal(controller) {
  if (controller.overlay) {
    controller.overlay.remove();
    controller.overlay = void 0;
  }
}
function wireEntityModalEvents(overlay, onClose, onEntityDetails) {
  overlay.addEventListener("click", (event) => {
    const target = event.target;
    if (target.hasAttribute("data-modal-overlay")) {
      onClose();
      return;
    }
    const closeButton = target.closest('[data-action="close-modal"]');
    if (closeButton) {
      onClose();
      return;
    }
    const entityItem = target.closest("[data-modal-entity-id]");
    if (entityItem) {
      event.preventDefault();
      event.stopPropagation();
      const entityId = entityItem.getAttribute("data-modal-entity-id");
      if (entityId) {
        onEntityDetails(entityId);
      }
    }
  });
}

// src/card/ui/panel.ts
function renderPanelContent(context, helpers) {
  if (!context.selectedNode) {
    return renderMapOverview(context);
  }
  return renderNodePanel(context, context.selectedNode, helpers);
}
function renderMapOverview(context) {
  if (!context.payload) {
    return `
      <div class="panel-empty">
        <div class="panel-empty__icon">\u{1F4E1}</div>
        <div class="panel-empty__text">Loading network data...</div>
      </div>
    `;
  }
  const nodes = Object.keys(context.payload.node_types ?? {});
  const edges = context.payload.edges ?? [];
  const nodeTypes = context.payload.node_types ?? {};
  const nodeStatus = context.payload.node_status ?? {};
  const deviceCounts = countDevicesByType(nodes, nodeTypes);
  const statusCounts = countNodeStatus(nodeStatus);
  return `
    <div class="panel-header">
      <div class="panel-header__title">Network Overview</div>
    </div>
    ${renderOverviewStatsGrid(nodes.length, edges.length)}
    ${renderOverviewStatusSection(statusCounts)}
    ${renderOverviewDeviceBreakdown(deviceCounts)}
    <div class="panel-hint">
      <span class="panel-hint__icon">\u{1F4A1}</span>
      Click a node in the map to see details
    </div>
  `;
}
function renderNodePanel(context, name, helpers) {
  const safeName = helpers.escapeHtml(name);
  if (!context.payload) {
    return `
      <div class="panel-header">
        <button type="button" class="panel-header__back" data-action="back">\u2190</button>
        <div class="panel-header__title">${safeName}</div>
      </div>
      <div class="panel-empty">
        <div class="panel-empty__text">No data available</div>
      </div>
    `;
  }
  const nodeType = context.payload.node_types?.[name] ?? "unknown";
  const typeIcon = helpers.getNodeTypeIcon(nodeType);
  const status = context.payload.node_status?.[name];
  const statusBadge = status ? helpers.getStatusBadgeHtml(status.state) : "";
  return `
    <div class="panel-header">
      <button type="button" class="panel-header__back" data-action="back">\u2190</button>
      <div class="panel-header__info">
        <div class="panel-header__title-row">
          <span class="panel-header__title">${safeName}</span>
          ${statusBadge}
        </div>
        <div class="panel-header__badge">${typeIcon} ${helpers.escapeHtml(nodeType)}</div>
      </div>
    </div>
    <div class="panel-tabs">
      <button type="button" class="panel-tab ${context.activeTab === "overview" ? "panel-tab--active" : ""}" data-tab="overview">Overview</button>
      <button type="button" class="panel-tab ${context.activeTab === "stats" ? "panel-tab--active" : ""}" data-tab="stats">Stats</button>
      <button type="button" class="panel-tab ${context.activeTab === "actions" ? "panel-tab--active" : ""}" data-tab="actions">Actions</button>
    </div>
    <div class="panel-tab-content">
      ${renderTabContent(context, name, helpers)}
    </div>
  `;
}
function renderTabContent(context, name, helpers) {
  switch (context.activeTab) {
    case "overview":
      return renderOverviewTab(context, name, helpers);
    case "stats":
      return renderStatsTab(context, name, helpers);
    case "actions":
      return renderActionsTab(context, name, helpers);
    default:
      return "";
  }
}
function renderOverviewTab(context, name, helpers) {
  const edges = context.payload?.edges ?? [];
  const neighbors = edges.filter((edge) => edge.left === name || edge.right === name).map((edge) => ({
    name: edge.left === name ? edge.right : edge.left,
    label: edge.label,
    wireless: edge.wireless,
    poe: edge.poe
  }));
  const uniqueNeighbors = Array.from(
    new Map(neighbors.map((n) => [n.name, n])).values()
  );
  const neighborList = uniqueNeighbors.length ? uniqueNeighbors.map(
    (n) => `
          <div class="neighbor-item">
            <span class="neighbor-item__name">${helpers.escapeHtml(n.name)}</span>
            <span class="neighbor-item__badges">
              ${n.wireless ? '<span class="badge badge--wireless">WiFi</span>' : ""}
              ${n.poe ? '<span class="badge badge--poe">PoE</span>' : ""}
              ${n.label ? `<span class="badge badge--port">${helpers.escapeHtml(n.label)}</span>` : ""}
            </span>
          </div>
        `
  ).join("") : '<div class="panel-empty__text">No connections</div>';
  return `
    <div class="panel-section">
      <div class="panel-section__title">Connected Devices</div>
      <div class="neighbor-list">${neighborList}</div>
    </div>
  `;
}
function renderStatsTab(context, name, helpers) {
  const edges = context.payload?.edges ?? [];
  const nodeEdges = edges.filter((edge) => edge.left === name || edge.right === name);
  const mac = context.payload?.client_macs?.[name] ?? context.payload?.device_macs?.[name] ?? null;
  const status = context.payload?.node_status?.[name];
  return `
    ${renderStatsLiveStatus(status, helpers)}
    ${renderStatsConnectionSection(nodeEdges)}
    ${renderStatsDeviceInfo(mac, helpers)}
  `;
}
function renderStatsLiveStatus(status, helpers) {
  if (!status) {
    return "";
  }
  return `
    <div class="panel-section">
      <div class="panel-section__title">Live Status</div>
      <div class="stats-list">
        <div class="stats-row">
          <span class="stats-row__label">Status</span>
          <span class="stats-row__value">${helpers.getStatusBadgeHtml(status.state)}</span>
        </div>
        <div class="stats-row">
          <span class="stats-row__label">Last Changed</span>
          <span class="stats-row__value">${helpers.formatLastChanged(status.last_changed)}</span>
        </div>
      </div>
    </div>
  `;
}
function renderStatsConnectionSection(nodeEdges) {
  const wirelessCount = nodeEdges.filter((e) => e.wireless).length;
  const wiredCount = nodeEdges.length - wirelessCount;
  const poeCount = nodeEdges.filter((e) => e.poe).length;
  const poeRow = poeCount > 0 ? `<div class="stats-row"><span class="stats-row__label">PoE Powered</span><span class="stats-row__value">${poeCount}</span></div>` : "";
  return `
    <div class="panel-section">
      <div class="panel-section__title">Connection Stats</div>
      <div class="stats-list">
        <div class="stats-row">
          <span class="stats-row__label">Total Connections</span>
          <span class="stats-row__value">${nodeEdges.length}</span>
        </div>
        <div class="stats-row">
          <span class="stats-row__label">Wired</span>
          <span class="stats-row__value">${wiredCount}</span>
        </div>
        <div class="stats-row">
          <span class="stats-row__label">Wireless</span>
          <span class="stats-row__value">${wirelessCount}</span>
        </div>
        ${poeRow}
      </div>
    </div>
  `;
}
function renderStatsDeviceInfo(mac, helpers) {
  if (!mac) {
    return "";
  }
  return `
    <div class="panel-section">
      <div class="panel-section__title">Device Info</div>
      <div class="info-row">
        <span class="info-row__label">MAC Address</span>
        <code class="info-row__value">${helpers.escapeHtml(mac)}</code>
      </div>
    </div>
  `;
}
function renderActionsTab(context, name, helpers) {
  const entityId = context.payload?.node_entities?.[name] ?? context.payload?.client_entities?.[name] ?? context.payload?.device_entities?.[name];
  const mac = context.payload?.client_macs?.[name] ?? context.payload?.device_macs?.[name] ?? null;
  const safeEntityId = entityId ? helpers.escapeHtml(entityId) : "";
  const safeMac = mac ? helpers.escapeHtml(mac) : "";
  return `
    <div class="panel-section">
      <div class="panel-section__title">Quick Actions</div>
      <div class="actions-list">
        ${entityId ? `
            <button type="button" class="action-button action-button--primary" data-entity-id="${safeEntityId}">
              <span class="action-button__icon">\u{1F4CA}</span>
              <span class="action-button__text">View Entity Details</span>
            </button>
          ` : `<div class="panel-empty__text">No Home Assistant entity linked</div>`}
        ${mac ? `
            <button type="button" class="action-button" data-action="copy" data-copy-value="${safeMac}">
              <span class="action-button__icon">\u{1F4CB}</span>
              <span class="action-button__text">Copy MAC Address</span>
            </button>
          ` : ""}
      </div>
    </div>
    ${entityId ? `
      <div class="panel-section">
        <div class="panel-section__title">Entity</div>
        <code class="entity-id">${safeEntityId}</code>
      </div>
    ` : ""}
  `;
}
function renderOverviewStatsGrid(nodeCount, edgeCount) {
  return `
    <div class="panel-stats-grid">
      <div class="stat-card">
        <div class="stat-card__value">${nodeCount}</div>
        <div class="stat-card__label">Total Nodes</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__value">${edgeCount}</div>
        <div class="stat-card__label">Connections</div>
      </div>
    </div>
  `;
}
function renderOverviewStatusSection(counts) {
  if (!counts.hasStatus) {
    return "";
  }
  return `
    <div class="panel-section">
      <div class="panel-section__title">Live Status</div>
      <div class="device-list">
        <div class="device-row"><span class="status-dot status-dot--online"></span><span class="device-row__label">Online</span><span class="device-row__count">${counts.online}</span></div>
        <div class="device-row"><span class="status-dot status-dot--offline"></span><span class="device-row__label">Offline</span><span class="device-row__count">${counts.offline}</span></div>
      </div>
    </div>
  `;
}
function renderOverviewDeviceBreakdown(counts) {
  const items = [
    { key: "gateways", icon: "\u{1F310}", label: "Gateways" },
    { key: "switches", icon: "\u{1F500}", label: "Switches" },
    { key: "aps", icon: "\u{1F4F6}", label: "Access Points" },
    { key: "clients", icon: "\u{1F4BB}", label: "Clients" },
    { key: "other", icon: "\u{1F4E6}", label: "Other" }
  ];
  const rows = items.filter((item) => counts[item.key] > 0).map(
    (item) => `<div class="device-row"><span class="device-row__icon">${item.icon}</span><span class="device-row__label">${item.label}</span><span class="device-row__count">${counts[item.key]}</span></div>`
  ).join("");
  return `
    <div class="panel-section">
      <div class="panel-section__title">Device Breakdown</div>
      <div class="device-list">${rows}</div>
    </div>
  `;
}
function countDevicesByType(nodes, nodeTypes) {
  return {
    gateways: nodes.filter((n) => nodeTypes[n] === "gateway").length,
    switches: nodes.filter((n) => nodeTypes[n] === "switch").length,
    aps: nodes.filter((n) => nodeTypes[n] === "ap").length,
    clients: nodes.filter((n) => nodeTypes[n] === "client").length,
    other: nodes.filter((n) => !["gateway", "switch", "ap", "client"].includes(nodeTypes[n])).length
  };
}
function countNodeStatus(nodeStatus) {
  const values = Object.values(nodeStatus);
  return {
    online: values.filter((s) => s.state === "online").length,
    offline: values.filter((s) => s.state === "offline").length,
    hasStatus: values.length > 0
  };
}

// src/card/ui/context-menu.ts
function renderContextMenu(options) {
  const safeName = escapeHtml(options.nodeName);
  const nodeType = options.payload?.node_types?.[options.nodeName] ?? "unknown";
  const typeIcon = options.getNodeTypeIcon(nodeType);
  const mac = options.payload?.client_macs?.[options.nodeName] ?? options.payload?.device_macs?.[options.nodeName];
  const entityId = options.payload?.node_entities?.[options.nodeName] ?? options.payload?.client_entities?.[options.nodeName] ?? options.payload?.device_entities?.[options.nodeName];
  const isDevice = nodeType !== "client";
  const items = [];
  items.push(`
    <button type="button" class="context-menu__item" data-context-action="select">
      <span class="context-menu__icon">\u{1F446}</span>
      <span>Select</span>
    </button>
  `);
  if (entityId) {
    items.push(`
      <button type="button" class="context-menu__item" data-context-action="details">
        <span class="context-menu__icon">\u{1F4CA}</span>
        <span>View Details</span>
      </button>
    `);
  }
  if (mac) {
    items.push(`
      <button type="button" class="context-menu__item" data-context-action="copy-mac" data-mac="${escapeHtml(mac)}">
        <span class="context-menu__icon">\u{1F4CB}</span>
        <span>Copy MAC Address</span>
      </button>
    `);
  }
  items.push('<div class="context-menu__divider"></div>');
  if (isDevice) {
    items.push(`
      <button type="button" class="context-menu__item" data-context-action="restart" ${!entityId ? "disabled" : ""}>
        <span class="context-menu__icon">\u{1F504}</span>
        <span>Restart Device</span>
      </button>
    `);
  }
  return `
    <div class="context-menu" data-theme="${escapeHtml(options.theme)}" data-context-node="${safeName}">
      <div class="context-menu__header">
        <div class="context-menu__title">${typeIcon} ${safeName}</div>
        <div class="context-menu__type">${escapeHtml(nodeType)}</div>
      </div>
      ${items.join("")}
    </div>
  `;
}
function parseContextMenuAction(target) {
  const actionButton = target.closest("[data-context-action]");
  if (!actionButton || actionButton.disabled) {
    return null;
  }
  const action = actionButton.getAttribute("data-context-action") ?? "unknown";
  const mac = actionButton.getAttribute("data-mac");
  return {
    action: isContextMenuAction(action) ? action : "unknown",
    mac
  };
}
function isContextMenuAction(action) {
  return action === "select" || action === "details" || action === "copy-mac" || action === "restart";
}

// src/card/data/auth.ts
async function fetchWithAuth(url, token, signal, parseResponse) {
  if (!token) {
    return { error: "Missing auth token" };
  }
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return { data: await parseResponse(response) };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { aborted: true };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}

// src/card/shared/feedback.ts
var TOAST_STYLES = {
  success: "rgba(34, 197, 94, 0.9)",
  info: "rgba(59, 130, 246, 0.9)",
  error: "rgba(239, 68, 68, 0.9)"
};
function showToast(message, variant) {
  const feedback = document.createElement("div");
  feedback.textContent = message;
  feedback.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${TOAST_STYLES[variant]};
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 1002;
    animation: fadeInOut 2s ease forwards;
  `;
  document.body.appendChild(feedback);
  setTimeout(() => feedback.remove(), 2e3);
}

// src/card/data/data.ts
async function loadSvg(fetchWithAuth2, url, signal) {
  return fetchWithAuth2(url, signal, (response) => response.text());
}
async function loadPayload(fetchWithAuth2, url, signal) {
  return fetchWithAuth2(url, signal, (response) => response.json());
}

// src/card/core/state.ts
function normalizeConfig(config) {
  if (config.entry_id) {
    const theme = config.theme ?? "dark";
    const themeSuffix = `?theme=${theme}`;
    return {
      entry_id: config.entry_id,
      theme,
      svg_url: `/api/${DOMAIN}/${config.entry_id}/svg${themeSuffix}`,
      data_url: `/api/${DOMAIN}/${config.entry_id}/payload`
    };
  }
  return config;
}
function startPolling(currentId, intervalMs, onTick) {
  if (currentId !== void 0) {
    window.clearInterval(currentId);
  }
  return window.setInterval(onTick, intervalMs);
}
function stopPolling(currentId) {
  if (currentId !== void 0) {
    window.clearInterval(currentId);
  }
  return void 0;
}

// src/card/interaction/context-menu-state.ts
function createContextMenuController() {
  return {};
}
function openContextMenu(params) {
  const container = document.createElement("div");
  container.innerHTML = params.renderMenu(params.menu.nodeName);
  const menuEl = container.firstElementChild;
  if (!menuEl) {
    return;
  }
  document.body.appendChild(menuEl);
  params.controller.menu = params.menu;
  params.controller.element = menuEl;
  positionContextMenu(menuEl, params.menu.x, params.menu.y);
  wireContextMenuEvents(
    menuEl,
    () => closeContextMenu(params.controller),
    (action, mac) => params.onAction(action, params.menu.nodeName, mac)
  );
}
function closeContextMenu(controller) {
  if (controller.element) {
    controller.element._cleanup?.();
    controller.element.remove();
  }
  controller.element = void 0;
  controller.menu = void 0;
}
function positionContextMenu(menu, x, y) {
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  requestAnimationFrame(() => {
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let adjustedX = x;
    let adjustedY = y;
    if (rect.right > viewportWidth) {
      adjustedX = viewportWidth - rect.width - 8;
    }
    if (rect.bottom > viewportHeight) {
      adjustedY = viewportHeight - rect.height - 8;
    }
    if (adjustedX < 8) {
      adjustedX = 8;
    }
    if (adjustedY < 8) {
      adjustedY = 8;
    }
    menu.style.left = `${adjustedX}px`;
    menu.style.top = `${adjustedY}px`;
  });
}
function wireContextMenuEvents(menu, onClose, onAction) {
  const handleClick = (event) => {
    const target = event.target;
    const result = parseContextMenuAction(target);
    if (!result) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    onAction(result.action, result.mac);
  };
  const handleClickOutside = (event) => {
    if (!menu.contains(event.target)) {
      onClose();
    }
  };
  const handleKeydown = (event) => {
    if (event.key === "Escape") {
      onClose();
    }
  };
  menu.addEventListener("click", handleClick);
  document.addEventListener("click", handleClickOutside, { once: true });
  document.addEventListener("keydown", handleKeydown);
  menu._cleanup = () => {
    menu.removeEventListener("click", handleClick);
    document.removeEventListener("click", handleClickOutside);
    document.removeEventListener("keydown", handleKeydown);
  };
}

// src/card/interaction/selection.ts
function createSelectionState() {
  return {};
}
function selectNode(state, nodeName) {
  state.selectedNode = nodeName;
}
function clearSelectedNode(state) {
  state.selectedNode = void 0;
}
function setHoveredNode(state, nodeName) {
  state.hoveredNode = nodeName ?? void 0;
}
function setHoveredEdge(state, edge) {
  state.hoveredEdge = edge ?? void 0;
}
function handleMapClick(params) {
  if (params.isControlTarget(params.event.target)) {
    return null;
  }
  if (params.panMoved) {
    return null;
  }
  const label = params.resolveNodeName(params.event) ?? params.state.hoveredNode;
  if (!label) {
    return null;
  }
  params.state.selectedNode = label;
  return label;
}

// src/card/interaction/viewport.ts
function bindViewportInteractions(params) {
  const { viewport, svg: svg2, state, options, handlers, callbacks, bindings } = params;
  viewport.onwheel = (event) => onWheel(event, svg2, state, options, callbacks);
  viewport.onpointerdown = (event) => onPointerDown(event, state, bindings.controls);
  viewport.onpointermove = (event) => onPointerMove(event, svg2, state, options, handlers, callbacks, bindings.tooltip);
  viewport.onpointerup = (event) => onPointerUp(event, state);
  viewport.onpointercancel = (event) => onPointerUp(event, state);
  viewport.onpointerleave = () => {
    callbacks.onHoverEdge(null);
    callbacks.onHoverNode(null);
    hideTooltip(bindings.tooltip);
  };
  viewport.onclick = (event) => onClick(event, state, handlers, callbacks, bindings.tooltip);
  viewport.oncontextmenu = (event) => onContextMenu(event, state, handlers, callbacks);
}
function applyTransform(svg2, transform, isPanning) {
  svg2.style.transformOrigin = "0 0";
  svg2.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
  svg2.style.cursor = isPanning ? "grabbing" : "grab";
}
function applyZoom(svg2, delta, state, options, callbacks) {
  const nextScale = Math.min(
    options.maxZoomScale,
    Math.max(options.minZoomScale, state.viewTransform.scale + delta)
  );
  state.viewTransform.scale = Number(nextScale.toFixed(2));
  callbacks.onUpdateTransform(state.viewTransform);
  applyTransform(svg2, state.viewTransform, state.isPanning);
}
function resetPan(svg2, state, callbacks) {
  state.viewTransform = { x: 0, y: 0, scale: 1 };
  callbacks.onUpdateTransform(state.viewTransform);
  applyTransform(svg2, state.viewTransform, state.isPanning);
}
function onWheel(event, svg2, state, options, callbacks) {
  event.preventDefault();
  const delta = event.deltaY > 0 ? -options.zoomIncrement : options.zoomIncrement;
  applyZoom(svg2, delta, state, options, callbacks);
}
function onPointerDown(event, state, controls) {
  if (isControlTarget(event.target, controls)) {
    return;
  }
  state.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  event.currentTarget.setPointerCapture(event.pointerId);
  if (state.activePointers.size === 2) {
    const [p1, p2] = Array.from(state.activePointers.values());
    state.pinchStartDistance = getDistance(p1, p2);
    state.pinchStartScale = state.viewTransform.scale;
    state.isPanning = false;
    state.panStart = null;
  } else if (state.activePointers.size === 1) {
    state.isPanning = true;
    state.panMoved = false;
    state.panStart = {
      x: event.clientX - state.viewTransform.x,
      y: event.clientY - state.viewTransform.y
    };
  }
}
function onPointerMove(event, svg2, state, options, handlers, callbacks, tooltip) {
  if (state.activePointers.has(event.pointerId)) {
    state.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  }
  if (state.activePointers.size === 2 && state.pinchStartDistance !== null && state.pinchStartScale !== null) {
    const [p1, p2] = Array.from(state.activePointers.values());
    const currentDistance = getDistance(p1, p2);
    const scaleFactor = currentDistance / state.pinchStartDistance;
    const newScale = Math.min(
      options.maxZoomScale,
      Math.max(options.minZoomScale, state.pinchStartScale * scaleFactor)
    );
    state.viewTransform.scale = Number(newScale.toFixed(2));
    state.panMoved = true;
    callbacks.onUpdateTransform(state.viewTransform);
    applyTransform(svg2, state.viewTransform, state.isPanning);
    return;
  }
  if (state.isPanning && state.panStart) {
    const nextX = event.clientX - state.panStart.x;
    const nextY = event.clientY - state.panStart.y;
    if (Math.abs(nextX - state.viewTransform.x) > options.minPanMovementThreshold || Math.abs(nextY - state.viewTransform.y) > options.minPanMovementThreshold) {
      state.panMoved = true;
    }
    state.viewTransform.x = nextX;
    state.viewTransform.y = nextY;
    callbacks.onUpdateTransform(state.viewTransform);
    applyTransform(svg2, state.viewTransform, state.isPanning);
    return;
  }
  const edge = handlers.findEdge(event.target);
  if (edge) {
    callbacks.onHoverEdge(edge);
    callbacks.onHoverNode(null);
    tooltip.hidden = false;
    tooltip.classList.add("unifi-network-map__tooltip--edge");
    tooltip.innerHTML = handlers.renderEdgeTooltip(edge);
    tooltip.style.transform = "none";
    tooltip.style.left = `${event.clientX + options.tooltipOffsetPx}px`;
    tooltip.style.top = `${event.clientY + options.tooltipOffsetPx}px`;
    return;
  }
  callbacks.onHoverEdge(null);
  const label = handlers.resolveNodeName(event);
  if (!label) {
    callbacks.onHoverNode(null);
    hideTooltip(tooltip);
    return;
  }
  callbacks.onHoverNode(label);
  tooltip.hidden = false;
  tooltip.classList.remove("unifi-network-map__tooltip--edge");
  tooltip.textContent = label;
  tooltip.style.transform = "none";
  tooltip.style.left = `${event.clientX + options.tooltipOffsetPx}px`;
  tooltip.style.top = `${event.clientY + options.tooltipOffsetPx}px`;
}
function onPointerUp(event, state) {
  state.activePointers.delete(event.pointerId);
  if (state.activePointers.size < 2) {
    state.pinchStartDistance = null;
    state.pinchStartScale = null;
  }
  if (state.activePointers.size === 0) {
    state.isPanning = false;
    state.panStart = null;
  }
}
function onClick(event, state, handlers, callbacks, tooltip) {
  if (isControlTarget(event.target, null)) {
    return;
  }
  if (state.panMoved) {
    return;
  }
  const label = handlers.resolveNodeName(event);
  if (!label) {
    return;
  }
  callbacks.onNodeSelected(label);
  hideTooltip(tooltip);
}
function onContextMenu(event, state, handlers, callbacks) {
  const nodeName = handlers.resolveNodeName(event);
  if (!nodeName) {
    return;
  }
  event.preventDefault();
  callbacks.onOpenContextMenu(event.clientX, event.clientY, nodeName);
}
function hideTooltip(tooltip) {
  tooltip.hidden = true;
  tooltip.classList.remove("unifi-network-map__tooltip--edge");
}
function isControlTarget(target, controls) {
  if (!controls) {
    return Boolean(target?.closest(".unifi-network-map__controls"));
  }
  return controls.contains(target) || Boolean(target?.closest(".unifi-network-map__controls"));
}
function getDistance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}
function createDefaultViewportState() {
  return {
    viewTransform: { x: 0, y: 0, scale: 1 },
    isPanning: false,
    panStart: null,
    panMoved: false,
    activePointers: /* @__PURE__ */ new Map(),
    pinchStartDistance: null,
    pinchStartScale: null
  };
}
function createDefaultViewportHandlers(edges) {
  return {
    resolveNodeName: (event) => resolveNodeName(event),
    findEdge: (target) => edges ? findEdgeFromTarget(target, edges) : null,
    renderEdgeTooltip: (edge) => renderEdgeTooltip(edge)
  };
}

// src/card/ui/styles.ts
var CARD_STYLES = `
  unifi-network-map { display: block; height: 100%; }
  unifi-network-map ha-card { display: flex; flex-direction: column; height: 100%; box-sizing: border-box; }
  .unifi-network-map__layout { display: grid; grid-template-columns: minmax(0, 2.5fr) minmax(280px, 1fr); gap: 12px; flex: 1; padding: 12px; }
  .unifi-network-map__viewport { position: relative; overflow: hidden; min-height: 300px; background: linear-gradient(135deg, #0b1016 0%, #111827 100%); border-radius: 12px; touch-action: none; }
  .unifi-network-map__viewport svg { width: 100%; height: auto; display: block; }
  .unifi-network-map__controls { position: absolute; top: 8px; right: 8px; display: flex; gap: 6px; z-index: 3; }
  .unifi-network-map__controls button { background: rgba(15, 23, 42, 0.9); color: #e5e7eb; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 6px 10px; font-size: 12px; cursor: pointer; backdrop-filter: blur(8px); transition: all 0.15s ease; }
  .unifi-network-map__controls button:hover { background: rgba(59, 130, 246, 0.3); border-color: rgba(59, 130, 246, 0.5); }
  .unifi-network-map__viewport svg text, .unifi-network-map__viewport svg g { cursor: pointer; }
  .unifi-network-map__viewport svg path[data-edge] { cursor: pointer; transition: stroke-width 0.15s ease, filter 0.15s ease; pointer-events: stroke; }
  .unifi-network-map__viewport svg path[data-edge-hitbox] { stroke: transparent; stroke-width: 14; fill: none; pointer-events: stroke; }
  .unifi-network-map__viewport svg path[data-edge]:hover { stroke-width: 4; filter: drop-shadow(0 0 4px currentColor); }
  .unifi-network-map__panel { padding: 0; background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); color: #e5e7eb; border-radius: 12px; font-size: 13px; overflow: hidden; display: flex; flex-direction: column; }
  .unifi-network-map__tooltip { position: fixed; z-index: 2; background: rgba(15, 23, 42, 0.95); color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 12px; pointer-events: none; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(8px); max-width: 280px; }
  .unifi-network-map__tooltip--edge { display: flex; flex-direction: column; gap: 4px; }
  .tooltip-edge__title { font-weight: 600; color: #f1f5f9; margin-bottom: 2px; }
  .tooltip-edge__row { display: flex; align-items: center; gap: 6px; color: #94a3b8; }
  .tooltip-edge__icon { font-size: 14px; width: 18px; text-align: center; }
  .tooltip-edge__label { color: #cbd5e1; }

  /* Panel Header */
  .panel-header { display: flex; align-items: center; gap: 12px; padding: 16px; background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(255,255,255,0.05); }
  .panel-header__back { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #94a3b8; padding: 6px 10px; cursor: pointer; font-size: 14px; transition: all 0.15s ease; }
  .panel-header__back:hover { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
  .panel-header__info { flex: 1; min-width: 0; }
  .panel-header__title { font-weight: 600; font-size: 15px; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .panel-header__badge { display: inline-flex; align-items: center; gap: 4px; margin-top: 4px; padding: 2px 8px; background: rgba(59, 130, 246, 0.15); color: #60a5fa; border-radius: 12px; font-size: 11px; text-transform: capitalize; }
  .panel-header__title-row { display: flex; align-items: center; gap: 8px; }

  /* Tabs */
  .panel-tabs { display: flex; padding: 0 16px; background: rgba(0,0,0,0.1); border-bottom: 1px solid rgba(255,255,255,0.05); }
  .panel-tab { flex: 1; padding: 10px 8px; background: none; border: none; border-bottom: 2px solid transparent; color: #64748b; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s ease; }
  .panel-tab:hover { color: #94a3b8; }
  .panel-tab--active { color: #60a5fa; border-bottom-color: #3b82f6; }
  .panel-tab-content { flex: 1; overflow-y: auto; padding: 16px; }

  /* Sections */
  .panel-section { margin-bottom: 16px; padding: 0 16px; }
  .panel-section__title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 8px; }

  /* Stats Grid */
  .panel-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 16px; }
  .stat-card { background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 10px; padding: 12px; text-align: center; }
  .stat-card__value { font-size: 24px; font-weight: 700; color: #60a5fa; }
  .stat-card__label { font-size: 11px; color: #94a3b8; margin-top: 2px; }

  /* Stats List */
  .stats-list { display: flex; flex-direction: column; gap: 2px; }
  .stats-row { display: flex; justify-content: space-between; padding: 8px 10px; background: rgba(255,255,255,0.03); border-radius: 6px; }
  .stats-row__label { color: #94a3b8; }
  .stats-row__value { font-weight: 600; color: #e2e8f0; }

  /* Device List */
  .device-list { display: flex; flex-direction: column; gap: 4px; }
  .device-row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: rgba(255,255,255,0.03); border-radius: 8px; }
  .device-row__icon { font-size: 14px; }
  .device-row__label { flex: 1; color: #cbd5e1; }
  .device-row__count { font-weight: 600; color: #60a5fa; background: rgba(59, 130, 246, 0.15); padding: 2px 8px; border-radius: 10px; font-size: 12px; }

  /* Neighbor List */
  .neighbor-list { display: flex; flex-direction: column; gap: 6px; }
  .neighbor-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; background: rgba(255,255,255,0.03); border-radius: 8px; transition: background 0.15s ease; }
  .neighbor-item:hover { background: rgba(255,255,255,0.06); }
  .neighbor-item__name { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #e2e8f0; font-size: 12px; }
  .neighbor-item__badges { display: flex; gap: 4px; flex-shrink: 0; }

  /* Badges */
  .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500; }
  .badge--wireless { background: rgba(168, 85, 247, 0.2); color: #c084fc; }
  .badge--poe { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
  .badge--port { background: rgba(255,255,255,0.1); color: #94a3b8; }

  /* Status Indicators */
  .status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .status-dot--online { background: #22c55e; box-shadow: 0 0 6px rgba(34, 197, 94, 0.5); animation: status-pulse 2s ease-in-out infinite; }
  .status-dot--offline { background: #ef4444; }
  .status-dot--unknown { background: #6b7280; }
  @keyframes status-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

  /* Status Badges */
  .status-badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
  .status-badge--online { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
  .status-badge--offline { background: rgba(239, 68, 68, 0.2); color: #f87171; }
  .status-badge--unknown { background: rgba(107, 114, 128, 0.2); color: #9ca3af; }

  /* Status Layer */
  .unifi-network-map__status-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }

  /* Loading + Error */
  .unifi-network-map__loading,
  .unifi-network-map__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 32px 16px;
    text-align: center;
    color: #e2e8f0;
  }
  .unifi-network-map__loading-text,
  .unifi-network-map__error-text {
    font-size: 13px;
    color: #cbd5e1;
  }
  .unifi-network-map__spinner {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    border: 3px solid rgba(148, 163, 184, 0.3);
    border-top-color: #60a5fa;
    animation: unifi-spin 0.8s linear infinite;
  }
  .unifi-network-map__retry {
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(59, 130, 246, 0.4);
    color: #e2e8f0;
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 12px;
    cursor: pointer;
  }
  .unifi-network-map__retry:hover {
    background: rgba(59, 130, 246, 0.35);
  }
  .unifi-network-map__loading-overlay {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    color: #cbd5e1;
    z-index: 2;
    pointer-events: none;
    font-size: 12px;
  }
  @keyframes unifi-spin {
    to { transform: rotate(360deg); }
  }

  /* Info Row */
  .info-row { display: flex; flex-direction: column; gap: 4px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; }
  .info-row__label { font-size: 11px; color: #64748b; }
  .info-row__value { font-family: ui-monospace, monospace; font-size: 12px; color: #60a5fa; word-break: break-all; }

  /* Actions */
  .actions-list { display: flex; flex-direction: column; gap: 8px; }
  .action-button { display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #e2e8f0; font-size: 13px; cursor: pointer; transition: all 0.15s ease; text-align: left; }
  .action-button:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); }
  .action-button--primary { background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.3); }
  .action-button--primary:hover { background: rgba(59, 130, 246, 0.25); border-color: rgba(59, 130, 246, 0.4); }
  .action-button__icon { font-size: 16px; }
  .action-button__text { flex: 1; }

  /* Entity ID */
  .entity-id { display: block; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 6px; font-family: ui-monospace, monospace; font-size: 11px; color: #60a5fa; word-break: break-all; }

  /* Empty State */
  .panel-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 16px; text-align: center; }
  .panel-empty__icon { font-size: 32px; margin-bottom: 12px; opacity: 0.5; }
  .panel-empty__text { color: #64748b; font-size: 13px; }

  /* Hint */
  .panel-hint { display: flex; align-items: center; gap: 8px; padding: 12px; margin: 12px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; color: #94a3b8; font-size: 12px; }
  .panel-hint__icon { font-size: 14px; }

  /* Selected node highlight */
  .unifi-network-map__viewport svg [data-selected="true"],
  .unifi-network-map__viewport svg .node--selected {
    filter: none;
  }
  .unifi-network-map__viewport svg [data-selected="true"] > *,
  .unifi-network-map__viewport svg .node--selected > * {
    stroke: #3b82f6 !important;
    stroke-width: 2px;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .unifi-network-map__viewport svg [data-selected="true"] > :not(text):not(tspan):not(foreignObject),
  .unifi-network-map__viewport svg .node--selected > :not(text):not(tspan):not(foreignObject) {
    filter: drop-shadow(0 0 6px #3b82f6) drop-shadow(0 0 12px rgba(59, 130, 246, 0.45));
  }
  .unifi-network-map__viewport svg [data-selected="true"] text,
  .unifi-network-map__viewport svg .node--selected text {
    stroke: none !important;
  }

  /* Light theme overrides */
  ha-card[data-theme="light"] .unifi-network-map__viewport { background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); }
  ha-card[data-theme="light"] .unifi-network-map__controls button { background: rgba(226, 232, 240, 0.9); color: #0f172a; border-color: rgba(148, 163, 184, 0.5); }
  ha-card[data-theme="light"] .unifi-network-map__panel { background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%); color: #0f172a; }
  ha-card[data-theme="light"] .panel-header { background: rgba(148, 163, 184, 0.15); border-bottom-color: rgba(148, 163, 184, 0.3); }
  ha-card[data-theme="light"] .panel-header__title { color: #0f172a; }
  ha-card[data-theme="light"] .panel-header__badge { background: rgba(59, 130, 246, 0.15); color: #1d4ed8; }
  ha-card[data-theme="light"] .panel-tab { color: #64748b; }
  ha-card[data-theme="light"] .panel-tab--active { color: #1d4ed8; border-bottom-color: #3b82f6; }
  ha-card[data-theme="light"] .panel-section__title { color: #475569; }
  ha-card[data-theme="light"] .stat-card__label { color: #64748b; }
  ha-card[data-theme="light"] .device-row { background: rgba(15, 23, 42, 0.04); }
  ha-card[data-theme="light"] .device-row__label { color: #0f172a; }
  ha-card[data-theme="light"] .device-row__count { color: #1d4ed8; }
  ha-card[data-theme="light"] .neighbor-item { background: rgba(15, 23, 42, 0.04); }
  ha-card[data-theme="light"] .neighbor-item__name { color: #0f172a; }
  ha-card[data-theme="light"] .stats-row { background: rgba(15, 23, 42, 0.04); }
  ha-card[data-theme="light"] .stats-row__label { color: #64748b; }
  ha-card[data-theme="light"] .stats-row__value { color: #0f172a; }
  ha-card[data-theme="light"] .info-row { background: rgba(15, 23, 42, 0.04); }
  ha-card[data-theme="light"] .info-row__label { color: #64748b; }
  ha-card[data-theme="light"] .info-row__value { color: #1d4ed8; }
  ha-card[data-theme="light"] .action-button { background: rgba(15, 23, 42, 0.04); border-color: rgba(148, 163, 184, 0.5); color: #0f172a; }
  ha-card[data-theme="light"] .action-button--primary { background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.3); }
  ha-card[data-theme="light"] .entity-id { background: rgba(15, 23, 42, 0.06); color: #1d4ed8; }
  ha-card[data-theme="light"] .panel-empty__text { color: #64748b; }
  ha-card[data-theme="light"] .panel-hint { background: rgba(59, 130, 246, 0.08); color: #475569; }
  ha-card[data-theme="light"] .unifi-network-map__tooltip { background: rgba(15, 23, 42, 0.9); }
  ha-card[data-theme="light"] .status-badge--online { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
  ha-card[data-theme="light"] .status-badge--offline { background: rgba(239, 68, 68, 0.15); color: #dc2626; }
  ha-card[data-theme="light"] .status-badge--unknown { background: rgba(107, 114, 128, 0.15); color: #6b7280; }

  @media (max-width: 800px) {
    .unifi-network-map__layout { grid-template-columns: 1fr; }
  }

  /* Entity Modal Styles */
  .entity-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }
  .entity-modal {
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
    border-radius: 16px;
    width: 90%;
    max-width: 480px;
    max-height: 85vh;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(148, 163, 184, 0.2);
  }
  .entity-modal__header {
    padding: 20px 24px;
    background: rgba(148, 163, 184, 0.1);
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .entity-modal__title {
    font-size: 18px;
    font-weight: 600;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .entity-modal__close {
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 24px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 8px;
    transition: all 0.2s;
  }
  .entity-modal__close:hover {
    background: rgba(148, 163, 184, 0.2);
    color: #f8fafc;
  }
  .entity-modal__body {
    padding: 20px 24px;
    overflow-y: auto;
    max-height: calc(85vh - 80px);
  }
  .entity-modal__section {
    margin-bottom: 20px;
  }
  .entity-modal__section:last-child {
    margin-bottom: 0;
  }
  .entity-modal__section-title {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
    margin-bottom: 12px;
  }
  .entity-modal__info-grid {
    display: grid;
    gap: 8px;
  }
  .entity-modal__info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 8px;
    border: 1px solid rgba(148, 163, 184, 0.1);
  }
  .entity-modal__info-label {
    color: #94a3b8;
    font-size: 13px;
  }
  .entity-modal__info-value {
    color: #f8fafc;
    font-size: 13px;
    font-weight: 500;
    font-family: monospace;
  }
  .entity-modal__entity-list {
    display: grid;
    gap: 8px;
  }
  .entity-modal__entity-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 10px;
    border: 1px solid rgba(148, 163, 184, 0.1);
    cursor: pointer;
    transition: all 0.2s;
  }
  .entity-modal__entity-item:hover {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.3);
  }
  .entity-modal__entity-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    flex: 1;
  }
  .entity-modal__entity-name {
    color: #f8fafc;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .entity-modal__entity-id {
    color: #64748b;
    font-size: 11px;
    font-family: monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .entity-modal__entity-state {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .entity-modal__state-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }
  .entity-modal__state-badge--home,
  .entity-modal__state-badge--on {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
  }
  .entity-modal__state-badge--not_home,
  .entity-modal__state-badge--off {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }
  .entity-modal__state-badge--default {
    background: rgba(148, 163, 184, 0.2);
    color: #94a3b8;
  }
  .entity-modal__domain-icon {
    font-size: 20px;
    flex-shrink: 0;
    margin-right: 12px;
  }
  .entity-modal__arrow {
    color: #64748b;
    margin-left: 8px;
  }

  /* Light theme modal */
  .entity-modal-overlay[data-theme="light"] .entity-modal {
    background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
  }
  .entity-modal-overlay[data-theme="light"] .entity-modal__header {
    background: rgba(148, 163, 184, 0.15);
    border-bottom-color: rgba(148, 163, 184, 0.3);
  }
  .entity-modal-overlay[data-theme="light"] .entity-modal__title { color: #0f172a; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__close { color: #64748b; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__close:hover { background: rgba(15, 23, 42, 0.1); color: #0f172a; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__section-title { color: #475569; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__info-row { background: rgba(15, 23, 42, 0.04); }
  .entity-modal-overlay[data-theme="light"] .entity-modal__info-label { color: #64748b; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__info-value { color: #0f172a; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__entity-item { background: rgba(15, 23, 42, 0.04); }
  .entity-modal-overlay[data-theme="light"] .entity-modal__entity-item:hover { background: rgba(59, 130, 246, 0.1); }
  .entity-modal-overlay[data-theme="light"] .entity-modal__entity-name { color: #0f172a; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__entity-id { color: #64748b; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__state-badge--home,
  .entity-modal-overlay[data-theme="light"] .entity-modal__state-badge--on { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__state-badge--not_home,
  .entity-modal-overlay[data-theme="light"] .entity-modal__state-badge--off { background: rgba(239, 68, 68, 0.15); color: #dc2626; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__state-badge--default { background: rgba(107, 114, 128, 0.15); color: #6b7280; }

  /* Context Menu */
  .context-menu {
    position: fixed;
    z-index: 1001;
    background: rgba(15, 23, 42, 0.98);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 12px;
    padding: 6px;
    min-width: 180px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(12px);
  }
  .context-menu__header {
    padding: 8px 12px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    margin-bottom: 4px;
  }
  .context-menu__title {
    font-size: 12px;
    font-weight: 600;
    color: #f1f5f9;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }
  .context-menu__type {
    font-size: 10px;
    color: #64748b;
    margin-top: 2px;
    text-transform: capitalize;
  }
  .context-menu__item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }
  .context-menu__item:hover {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
  }
  .context-menu__item:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .context-menu__item:disabled:hover {
    background: transparent;
    color: #e2e8f0;
  }
  .context-menu__icon {
    font-size: 14px;
    width: 20px;
    text-align: center;
  }
  .context-menu__divider {
    height: 1px;
    background: rgba(148, 163, 184, 0.1);
    margin: 4px 0;
  }
  .context-menu__item--danger:hover {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
  }

  /* Light theme context menu */
  .context-menu[data-theme="light"] {
    background: rgba(255, 255, 255, 0.98);
    border-color: rgba(148, 163, 184, 0.3);
  }
  .context-menu[data-theme="light"] .context-menu__title { color: #0f172a; }
  .context-menu[data-theme="light"] .context-menu__type { color: #64748b; }
  .context-menu[data-theme="light"] .context-menu__item { color: #0f172a; }
  .context-menu[data-theme="light"] .context-menu__item:hover { background: rgba(59, 130, 246, 0.1); color: #1d4ed8; }
  .context-menu[data-theme="light"] .context-menu__item--danger:hover { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
  .context-menu[data-theme="light"] .context-menu__divider { background: rgba(148, 163, 184, 0.2); }
`;
var GLOBAL_STYLES = `
  /* Entity Modal Styles (appended to document.body) */
  .entity-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }
  .entity-modal {
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
    border-radius: 16px;
    width: 90%;
    max-width: 480px;
    max-height: 85vh;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(148, 163, 184, 0.2);
  }
  .entity-modal__header {
    padding: 20px 24px;
    background: rgba(148, 163, 184, 0.1);
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .entity-modal__title {
    font-size: 18px;
    font-weight: 600;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .entity-modal__close {
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 24px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 8px;
    transition: all 0.2s;
  }
  .entity-modal__close:hover {
    background: rgba(148, 163, 184, 0.2);
    color: #f8fafc;
  }
  .entity-modal__body {
    padding: 20px 24px;
    overflow-y: auto;
    max-height: calc(85vh - 80px);
  }
  .entity-modal__section {
    margin-bottom: 20px;
  }
  .entity-modal__section:last-child {
    margin-bottom: 0;
  }
  .entity-modal__section-title {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
    margin-bottom: 12px;
  }
  .entity-modal__info-grid {
    display: grid;
    gap: 8px;
  }
  .entity-modal__info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 8px;
    border: 1px solid rgba(148, 163, 184, 0.1);
  }
  .entity-modal__info-label {
    color: #94a3b8;
    font-size: 13px;
  }
  .entity-modal__info-value {
    color: #f8fafc;
    font-size: 13px;
    font-weight: 500;
    font-family: monospace;
  }
  .entity-modal__entity-list {
    display: grid;
    gap: 8px;
  }
  .entity-modal__entity-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 10px;
    border: 1px solid rgba(148, 163, 184, 0.1);
    cursor: pointer;
    transition: all 0.2s;
  }
  .entity-modal__entity-item:hover {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.3);
  }
  .entity-modal__entity-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    flex: 1;
  }
  .entity-modal__entity-name {
    color: #f8fafc;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .entity-modal__entity-id {
    color: #64748b;
    font-size: 11px;
    font-family: monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .entity-modal__entity-state {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .entity-modal__state-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }
  .entity-modal__state-badge--home,
  .entity-modal__state-badge--on {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
  }
  .entity-modal__state-badge--not_home,
  .entity-modal__state-badge--off {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }
  .entity-modal__state-badge--default {
    background: rgba(148, 163, 184, 0.2);
    color: #94a3b8;
  }
  .entity-modal__domain-icon {
    font-size: 20px;
    flex-shrink: 0;
    margin-right: 12px;
  }
  .entity-modal__arrow {
    color: #64748b;
    margin-left: 8px;
  }
  .panel-empty__text {
    color: #64748b;
    font-size: 13px;
  }

  /* Light theme modal */
  .entity-modal-overlay[data-theme="light"] .entity-modal {
    background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
  }
  .entity-modal-overlay[data-theme="light"] .entity-modal__header {
    background: rgba(148, 163, 184, 0.15);
    border-bottom-color: rgba(148, 163, 184, 0.3);
  }
  .entity-modal-overlay[data-theme="light"] .entity-modal__title { color: #0f172a; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__close { color: #64748b; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__close:hover { background: rgba(15, 23, 42, 0.1); color: #0f172a; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__section-title { color: #475569; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__info-row { background: rgba(15, 23, 42, 0.04); }
  .entity-modal-overlay[data-theme="light"] .entity-modal__info-label { color: #64748b; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__info-value { color: #0f172a; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__entity-item { background: rgba(15, 23, 42, 0.04); }
  .entity-modal-overlay[data-theme="light"] .entity-modal__entity-item:hover { background: rgba(59, 130, 246, 0.1); }
  .entity-modal-overlay[data-theme="light"] .entity-modal__entity-name { color: #0f172a; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__entity-id { color: #64748b; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__state-badge--home,
  .entity-modal-overlay[data-theme="light"] .entity-modal__state-badge--on { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__state-badge--not_home,
  .entity-modal-overlay[data-theme="light"] .entity-modal__state-badge--off { background: rgba(239, 68, 68, 0.15); color: #dc2626; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__state-badge--default { background: rgba(107, 114, 128, 0.15); color: #6b7280; }

  /* Context Menu (appended to document.body) */
  .context-menu {
    position: fixed;
    z-index: 1001;
    background: rgba(15, 23, 42, 0.98);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 12px;
    padding: 6px;
    min-width: 180px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(12px);
  }
  .context-menu__header {
    padding: 8px 12px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    margin-bottom: 4px;
  }
  .context-menu__title {
    font-size: 12px;
    font-weight: 600;
    color: #f1f5f9;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }
  .context-menu__type {
    font-size: 10px;
    color: #64748b;
    margin-top: 2px;
    text-transform: capitalize;
  }
  .context-menu__item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }
  .context-menu__item:hover {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
  }
  .context-menu__item:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .context-menu__item:disabled:hover {
    background: transparent;
    color: #e2e8f0;
  }
  .context-menu__icon {
    font-size: 14px;
    width: 20px;
    text-align: center;
  }
  .context-menu__divider {
    height: 1px;
    background: rgba(148, 163, 184, 0.1);
    margin: 4px 0;
  }
  .context-menu__item--danger:hover {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
  }

  /* Light theme context menu */
  .context-menu[data-theme="light"] {
    background: rgba(255, 255, 255, 0.98);
    border-color: rgba(148, 163, 184, 0.3);
  }
  .context-menu[data-theme="light"] .context-menu__title { color: #0f172a; }
  .context-menu[data-theme="light"] .context-menu__type { color: #64748b; }
  .context-menu[data-theme="light"] .context-menu__item { color: #0f172a; }
  .context-menu[data-theme="light"] .context-menu__item:hover { background: rgba(59, 130, 246, 0.1); color: #1d4ed8; }
  .context-menu[data-theme="light"] .context-menu__item--danger:hover { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
  .context-menu[data-theme="light"] .context-menu__divider { background: rgba(148, 163, 184, 0.2); }

  /* Toast feedback animation */
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
    15% { opacity: 1; transform: translateX(-50%) translateY(0); }
    85% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  }
`;

// src/card/core/unifi-network-map-card.ts
var UnifiNetworkMapCard = class extends HTMLElement {
  constructor() {
    super(...arguments);
    this._loading = false;
    this._dataLoading = false;
    this._viewportState = createDefaultViewportState();
    this._selection = createSelectionState();
    this._activeTab = "overview";
    this._entityModal = createEntityModalController();
    this._contextMenu = createContextMenuController();
  }
  static getLayoutOptions() {
    return { grid_columns: 4, grid_rows: 3, grid_min_columns: 2, grid_min_rows: 2 };
  }
  static getConfigElement() {
    return document.createElement("unifi-network-map-editor");
  }
  static getStubConfig() {
    return { entry_id: "", theme: "dark" };
  }
  setConfig(config) {
    this._config = normalizeConfig(config);
    this._render();
  }
  set hass(hass) {
    this._hass = hass;
    this._render();
  }
  connectedCallback() {
    this._render();
    this._startStatusPolling();
  }
  disconnectedCallback() {
    this._stopStatusPolling();
    this._removeEntityModal();
    this._removeContextMenu();
  }
  _startStatusPolling() {
    this._statusPollInterval = startPolling(this._statusPollInterval, 3e4, () => {
      this._refreshPayload();
    });
  }
  _stopStatusPolling() {
    this._statusPollInterval = stopPolling(this._statusPollInterval);
  }
  _refreshPayload() {
    this._lastDataUrl = void 0;
    this._loadPayload();
  }
  get _viewTransform() {
    return this._viewportState.viewTransform;
  }
  set _viewTransform(value) {
    this._viewportState.viewTransform = value;
  }
  get _isPanning() {
    return this._viewportState.isPanning;
  }
  set _isPanning(value) {
    this._viewportState.isPanning = value;
  }
  get _panStart() {
    return this._viewportState.panStart;
  }
  set _panStart(value) {
    this._viewportState.panStart = value;
  }
  get _panMoved() {
    return this._viewportState.panMoved;
  }
  set _panMoved(value) {
    this._viewportState.panMoved = value;
  }
  get _activePointers() {
    return this._viewportState.activePointers;
  }
  set _activePointers(value) {
    this._viewportState.activePointers = value;
  }
  get _pinchStartDistance() {
    return this._viewportState.pinchStartDistance;
  }
  set _pinchStartDistance(value) {
    this._viewportState.pinchStartDistance = value;
  }
  get _pinchStartScale() {
    return this._viewportState.pinchStartScale;
  }
  set _pinchStartScale(value) {
    this._viewportState.pinchStartScale = value;
  }
  _getAuthToken() {
    return this._hass?.auth?.data?.access_token;
  }
  async _fetchWithAuth(url, signal, parseResponse) {
    return fetchWithAuth(url, this._getAuthToken(), signal, parseResponse);
  }
  _render() {
    const theme = this._config?.theme ?? "dark";
    if (!this._config) {
      this._setCardBody('<div style="padding:16px;">Missing configuration</div>', theme);
      return;
    }
    if (!this._config.svg_url) {
      this._setCardBody(
        '<div style="padding:16px;">Select a UniFi Network Map instance in the card settings.</div>',
        theme
      );
      return;
    }
    const token = this._getAuthToken();
    if (token && this._error === "Missing auth token") {
      this._error = void 0;
    }
    const body = this._error ? this._renderError() : this._svgContent ? this._renderLayout() : this._renderLoading();
    this._setCardBody(body, theme);
    if (!token && this._error === "Missing auth token") {
      return;
    }
    this._ensureStyles();
    this._wireRetry();
    this._loadSvg();
    this._loadPayload();
    this._wireInteractions();
  }
  _setCardBody(body, theme) {
    const card = document.createElement("ha-card");
    card.dataset.theme = theme;
    card.innerHTML = sanitizeHtml(body);
    this.replaceChildren(card);
  }
  async _loadSvg() {
    if (!this._config?.svg_url || !this._hass) {
      return;
    }
    if (this._loading || this._config.svg_url === this._lastSvgUrl) {
      return;
    }
    if (!this._getAuthToken()) {
      this._error = "Missing auth token";
      this._render();
      return;
    }
    this._svgAbortController?.abort();
    this._svgAbortController = new AbortController();
    const currentUrl = this._config.svg_url;
    this._loading = true;
    this._render();
    const result = await loadSvg(
      this._fetchWithAuth.bind(this),
      currentUrl,
      this._svgAbortController.signal
    );
    if ("aborted" in result) {
      return;
    }
    if ("error" in result) {
      this._error = `Failed to load SVG (${result.error})`;
    } else {
      this._svgContent = result.data;
      this._error = void 0;
    }
    this._lastSvgUrl = currentUrl;
    this._loading = false;
    this._render();
  }
  async _loadPayload() {
    if (!this._config?.data_url || !this._hass) {
      return;
    }
    if (this._dataLoading || this._config.data_url === this._lastDataUrl) {
      return;
    }
    if (!this._getAuthToken()) {
      return;
    }
    this._payloadAbortController?.abort();
    this._payloadAbortController = new AbortController();
    const currentUrl = this._config.data_url;
    this._dataLoading = true;
    this._render();
    const result = await loadPayload(
      this._fetchWithAuth.bind(this),
      currentUrl,
      this._payloadAbortController.signal
    );
    if ("aborted" in result) {
      return;
    }
    if ("error" in result) {
      this._error = `Failed to load payload (${result.error})`;
    } else {
      this._payload = result.data;
    }
    this._lastDataUrl = currentUrl;
    this._dataLoading = false;
    this._render();
  }
  _renderLoading() {
    return `
      <div class="unifi-network-map__loading">
        <div class="unifi-network-map__spinner" role="progressbar" aria-label="Loading"></div>
        <div class="unifi-network-map__loading-text">Loading map...</div>
      </div>
    `;
  }
  _renderError() {
    return `
      <div class="unifi-network-map__error">
        <div class="unifi-network-map__error-text">${escapeHtml(this._error ?? "Unknown error")}</div>
        <button type="button" class="unifi-network-map__retry" data-action="retry">Retry</button>
      </div>
    `;
  }
  _renderLayout() {
    const safeSvg = this._svgContent ? sanitizeSvg(this._svgContent) : "";
    return `
      <div class="unifi-network-map__layout">
        <div class="unifi-network-map__viewport">
          <div class="unifi-network-map__controls">
            <button type="button" data-action="zoom-in" title="Zoom in">+</button>
            <button type="button" data-action="zoom-out" title="Zoom out">-</button>
            <button type="button" data-action="reset" title="Reset view">Reset</button>
          </div>
          ${this._renderLoadingOverlay()}
          ${safeSvg}
          <div class="unifi-network-map__status-layer"></div>
          <div class="unifi-network-map__tooltip" hidden></div>
        </div>
        <div class="unifi-network-map__panel">
          ${this._renderPanelContent()}
        </div>
      </div>
    `;
  }
  _renderLoadingOverlay() {
    if (!this._isLoading()) {
      return "";
    }
    return `
      <div class="unifi-network-map__loading-overlay">
        <div class="unifi-network-map__spinner"></div>
        <div class="unifi-network-map__loading-text">Refreshing data...</div>
      </div>
    `;
  }
  _isLoading() {
    return this._loading || this._dataLoading;
  }
  _wireRetry() {
    const retryButton = this.querySelector('[data-action="retry"]');
    if (!retryButton) return;
    retryButton.onclick = (event) => {
      event.preventDefault();
      this._retryLoad();
    };
  }
  _retryLoad() {
    this._error = void 0;
    this._lastSvgUrl = void 0;
    this._lastDataUrl = void 0;
    this._svgAbortController?.abort();
    this._payloadAbortController?.abort();
    this._loadSvg();
    this._loadPayload();
    this._render();
  }
  _renderPanelContent() {
    return renderPanelContent(
      {
        payload: this._payload,
        selectedNode: this._selection.selectedNode,
        activeTab: this._activeTab
      },
      this._panelHelpers()
    );
  }
  _renderTabContent(name) {
    return renderTabContent(
      {
        payload: this._payload,
        selectedNode: this._selection.selectedNode,
        activeTab: this._activeTab
      },
      name,
      this._panelHelpers()
    );
  }
  _panelHelpers() {
    return {
      escapeHtml,
      getNodeTypeIcon: (nodeType) => this._getNodeTypeIcon(nodeType),
      getStatusBadgeHtml: (state) => this._getStatusBadgeHtml(state),
      formatLastChanged: (value) => this._formatLastChanged(value)
    };
  }
  _getNodeTypeIcon(nodeType) {
    switch (nodeType) {
      case "gateway":
        return "\u{1F310}";
      case "switch":
        return "\u{1F500}";
      case "ap":
        return "\u{1F4F6}";
      case "client":
        return "\u{1F4BB}";
      default:
        return "\u{1F4E6}";
    }
  }
  _getStatusBadgeHtml(state) {
    const labels = {
      online: "Online",
      offline: "Offline",
      unknown: "Unknown"
    };
    return `<span class="status-badge status-badge--${state}">${labels[state]}</span>`;
  }
  _formatLastChanged(isoString) {
    if (!isoString) return "Unknown";
    try {
      const date = new Date(isoString);
      const now = /* @__PURE__ */ new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 6e4);
      if (diffMin < 1) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return "Unknown";
    }
  }
  _ensureStyles() {
    if (this.querySelector("style[data-unifi-network-map]")) {
      return;
    }
    const style = document.createElement("style");
    style.dataset.unifiNetworkMap = "true";
    style.textContent = CARD_STYLES;
    this.appendChild(style);
    this._ensureGlobalStyles();
  }
  _ensureGlobalStyles() {
    if (document.head.querySelector("style[data-unifi-network-map-global]")) {
      return;
    }
    const style = document.createElement("style");
    style.dataset.unifiNetworkMapGlobal = "true";
    style.textContent = GLOBAL_STYLES;
    document.head.appendChild(style);
  }
  _wireInteractions() {
    const viewport = this.querySelector(".unifi-network-map__viewport");
    const svg2 = viewport?.querySelector("svg");
    const tooltip = viewport?.querySelector(".unifi-network-map__tooltip");
    const panel = this.querySelector(".unifi-network-map__panel");
    if (!viewport || !svg2 || !tooltip) {
      return;
    }
    this._ensureStyles();
    const options = this._viewportOptions();
    const callbacks = this._viewportCallbacks();
    applyTransform(svg2, this._viewportState.viewTransform, this._viewportState.isPanning);
    annotateNodeIds(svg2, Object.keys(this._payload?.node_types ?? {}));
    this._highlightSelectedNode(svg2);
    this._annotateEdges(svg2);
    this._wireControls(svg2);
    bindViewportInteractions({
      viewport,
      svg: svg2,
      state: this._viewportState,
      options,
      handlers: createDefaultViewportHandlers(this._payload?.edges),
      callbacks,
      bindings: {
        tooltip,
        controls: viewport.querySelector(".unifi-network-map__controls")
      }
    });
    if (panel) {
      panel.onclick = (event) => this._onPanelClick(event);
    }
  }
  _onPanelClick(event) {
    const target = event.target;
    if (this._handleTabClick(target, event)) return;
    if (this._handleBackClick(target, event)) return;
    if (this._handleCopyClick(target, event)) return;
    this._handleEntityClick(target, event);
  }
  _handleTabClick(target, event) {
    const tab = target.closest("[data-tab]");
    if (!tab) return false;
    event.preventDefault();
    const tabName = tab.getAttribute("data-tab");
    if (tabName && tabName !== this._activeTab) {
      this._activeTab = tabName;
      this._render();
    }
    return true;
  }
  _handleBackClick(target, event) {
    const backButton = target.closest('[data-action="back"]');
    if (!backButton) return false;
    event.preventDefault();
    clearSelectedNode(this._selection);
    this._activeTab = "overview";
    this._render();
    return true;
  }
  _handleCopyClick(target, event) {
    const copyButton = target.closest('[data-action="copy"]');
    if (!copyButton) return false;
    event.preventDefault();
    const value = copyButton.getAttribute("data-copy-value");
    if (value) {
      navigator.clipboard.writeText(value).then(() => {
        const textEl = copyButton.querySelector(".action-button__text");
        if (textEl) {
          const original = textEl.textContent;
          textEl.textContent = "Copied!";
          setTimeout(() => {
            textEl.textContent = original;
          }, 1500);
        }
      });
    }
    return true;
  }
  _handleEntityClick(target, event) {
    const entityButton = target.closest("[data-entity-id]");
    if (!entityButton) return false;
    event.preventDefault();
    if (this._selection.selectedNode) {
      this._showEntityModal(this._selection.selectedNode);
    }
    return true;
  }
  _showEntityModal(nodeName) {
    openEntityModal({
      controller: this._entityModal,
      nodeName,
      payload: this._payload,
      theme: this._config?.theme ?? "dark",
      getNodeTypeIcon: (nodeType) => this._getNodeTypeIcon(nodeType),
      formatLastChanged: (value) => this._formatLastChanged(value),
      onEntityDetails: (entityId) => this._openEntityDetails(entityId)
    });
  }
  _openEntityDetails(entityId) {
    this._removeEntityModal();
    window.setTimeout(() => {
      this.dispatchEvent(
        new CustomEvent("hass-more-info", {
          bubbles: true,
          composed: true,
          detail: { entityId }
        })
      );
    }, 0);
  }
  _removeEntityModal() {
    closeEntityModal(this._entityModal);
  }
  _showContextMenu() {
    if (!this._contextMenu.menu) {
      return;
    }
    openContextMenu({
      controller: this._contextMenu,
      menu: this._contextMenu.menu,
      renderMenu: (nodeName) => this._renderContextMenu(nodeName),
      onAction: (action, nodeName, mac) => this._handleContextMenuAction(action, nodeName, mac)
    });
  }
  _renderContextMenu(nodeName) {
    return renderContextMenu({
      nodeName,
      payload: this._payload,
      theme: this._config?.theme ?? "dark",
      getNodeTypeIcon: (nodeType) => this._getNodeTypeIcon(nodeType)
    });
  }
  _handleContextMenuAction(action, nodeName, mac) {
    switch (action) {
      case "select":
        selectNode(this._selection, nodeName);
        this._removeContextMenu();
        this._render();
        break;
      case "details":
        this._removeContextMenu();
        this._showEntityModal(nodeName);
        break;
      case "copy-mac":
        if (mac) {
          navigator.clipboard.writeText(mac).then(() => {
            this._showCopyFeedback();
          });
        }
        this._removeContextMenu();
        break;
      case "restart":
        this._handleRestartDevice(nodeName);
        this._removeContextMenu();
        break;
      default:
        this._removeContextMenu();
    }
  }
  _showCopyFeedback() {
    showToast("MAC address copied!", "success");
  }
  _handleRestartDevice(nodeName) {
    const entityId = this._payload?.node_entities?.[nodeName] ?? this._payload?.device_entities?.[nodeName];
    if (!entityId) {
      this._showActionError("No entity found for this device");
      return;
    }
    this.dispatchEvent(
      new CustomEvent("hass-action", {
        bubbles: true,
        composed: true,
        detail: {
          action: "call-service",
          service: "button.press",
          target: { entity_id: entityId.replace(/\.[^.]+$/, ".restart") }
        }
      })
    );
    this._showActionFeedback("Restart command sent");
  }
  _showActionFeedback(message) {
    showToast(message, "info");
  }
  _showActionError(message) {
    showToast(message, "error");
  }
  _removeContextMenu() {
    closeContextMenu(this._contextMenu);
  }
  _wireControls(svg2) {
    const zoomIn = this.querySelector('[data-action="zoom-in"]');
    const zoomOut = this.querySelector('[data-action="zoom-out"]');
    const reset = this.querySelector('[data-action="reset"]');
    const options = this._viewportOptions();
    const callbacks = this._viewportCallbacks();
    if (zoomIn) {
      zoomIn.onclick = (event) => {
        event.preventDefault();
        applyZoom(svg2, ZOOM_INCREMENT, this._viewportState, options, callbacks);
      };
    }
    if (zoomOut) {
      zoomOut.onclick = (event) => {
        event.preventDefault();
        applyZoom(svg2, -ZOOM_INCREMENT, this._viewportState, options, callbacks);
      };
    }
    if (reset) {
      reset.onclick = (event) => {
        event.preventDefault();
        resetPan(svg2, this._viewportState, callbacks);
        clearSelectedNode(this._selection);
        this._render();
      };
    }
  }
  _viewportOptions() {
    return {
      minPanMovementThreshold: MIN_PAN_MOVEMENT_THRESHOLD,
      zoomIncrement: ZOOM_INCREMENT,
      minZoomScale: MIN_ZOOM_SCALE,
      maxZoomScale: MAX_ZOOM_SCALE,
      tooltipOffsetPx: TOOLTIP_OFFSET_PX
    };
  }
  _viewportCallbacks() {
    return {
      onNodeSelected: (nodeName) => {
        selectNode(this._selection, nodeName);
        this._render();
      },
      onHoverEdge: (edge) => {
        setHoveredEdge(this._selection, edge);
      },
      onHoverNode: (nodeName) => {
        setHoveredNode(this._selection, nodeName);
      },
      onOpenContextMenu: (x, y, nodeName) => {
        this._removeContextMenu();
        this._contextMenu.menu = { nodeName, x, y };
        this._showContextMenu();
      },
      onUpdateTransform: (transform) => {
        this._viewportState.viewTransform = transform;
      }
    };
  }
  _applyTransform(svg2) {
    applyTransform(svg2, this._viewportState.viewTransform, this._viewportState.isPanning);
  }
  _applyZoom(delta, svg2) {
    applyZoom(svg2, delta, this._viewportState, this._viewportOptions(), this._viewportCallbacks());
  }
  _onWheel(event, svg2) {
    onWheel(event, svg2, this._viewportState, this._viewportOptions(), this._viewportCallbacks());
  }
  _onPointerDown(event) {
    const controls = this.querySelector(".unifi-network-map__controls");
    onPointerDown(event, this._viewportState, controls);
  }
  _onPointerMove(event, svg2, tooltip) {
    onPointerMove(
      event,
      svg2,
      this._viewportState,
      this._viewportOptions(),
      createDefaultViewportHandlers(this._payload?.edges),
      this._viewportCallbacks(),
      tooltip
    );
  }
  _onPointerUp(event) {
    onPointerUp(event, this._viewportState);
  }
  _hideTooltip(tooltip) {
    tooltip.hidden = true;
    tooltip.classList.remove("unifi-network-map__tooltip--edge");
  }
  _onClick(event, tooltip) {
    const selected = handleMapClick({
      event,
      state: this._selection,
      panMoved: this._viewportState.panMoved,
      isControlTarget: (target) => this._isControlTarget(target),
      resolveNodeName: (evt) => resolveNodeName(evt)
    });
    if (!selected) {
      return;
    }
    this._hideTooltip(tooltip);
    this._render();
  }
  _resolveNodeName(event) {
    return resolveNodeName(event);
  }
  _inferNodeName(target) {
    return inferNodeName(target);
  }
  _findNodeElement(svg2, nodeName) {
    return findNodeElement(svg2, nodeName);
  }
  _highlightSelectedNode(svg2) {
    highlightSelectedNode(svg2, this._selection.selectedNode);
  }
  _clearNodeSelection(svg2) {
    clearNodeSelection(svg2);
  }
  _markNodeSelected(element) {
    markNodeSelected(element);
  }
  _annotateEdges(svg2) {
    if (!this._payload?.edges) return;
    annotateEdges(svg2, this._payload.edges);
  }
  _renderEdgeTooltip(edge) {
    return renderEdgeTooltip(edge);
  }
  _isControlTarget(target) {
    return Boolean(target?.closest(".unifi-network-map__controls"));
  }
};

// src/card/shared/editor-helpers.ts
function buildFormSchema(entries2) {
  const entryOptions = entries2.map((entry) => ({
    label: entry.title,
    value: entry.entry_id
  }));
  return [
    {
      name: "entry_id",
      required: true,
      selector: { select: { mode: "dropdown", options: entryOptions } },
      label: "UniFi Network Map Instance"
    },
    {
      name: "theme",
      selector: {
        select: {
          mode: "dropdown",
          options: [
            { label: "Dark (default)", value: "dark" },
            { label: "Light", value: "light" }
          ]
        }
      },
      label: "Theme"
    }
  ];
}
function normalizeTheme(value) {
  return value === "light" ? "light" : "dark";
}

// src/card/core/unifi-network-map-editor.ts
var UnifiNetworkMapEditor = class extends HTMLElement {
  constructor() {
    super(...arguments);
    this._entries = [];
    this._boundOnChange = (event) => this._onChange(event);
  }
  set hass(hass) {
    this._hass = hass;
    this._loadEntries();
  }
  setConfig(config) {
    this._config = config;
    this._render();
  }
  async _loadEntries() {
    if (!this._hass?.callWS) {
      return;
    }
    try {
      const entries2 = await this._hass.callWS({
        type: "config_entries/get",
        domain: DOMAIN
      });
      this._entries = entries2;
      if (!this._config?.entry_id && this._entries.length === 1) {
        this._updateConfigEntry(this._entries[0].entry_id);
        return;
      }
      this._render();
    } catch {
      this._entries = [];
      this._render();
    }
  }
  _render() {
    if (this._entries.length === 0) {
      this._renderNoEntries();
      return;
    }
    if (!this._form) {
      this._initializeForm();
      if (!this._form) {
        return;
      }
    }
    this._form.schema = this._buildFormSchema();
    this._form.data = {
      entry_id: this._config?.entry_id ?? "",
      theme: this._config?.theme ?? "dark"
    };
  }
  _renderNoEntries() {
    this.innerHTML = `
      <div style="padding: 16px;">
        <p style="color: var(--secondary-text-color);">
          No UniFi Network Map integrations found. Please add one first.
        </p>
      </div>
    `;
    this._form = void 0;
  }
  _initializeForm() {
    this.innerHTML = `
      <div style="padding: 16px;">
        <ha-form></ha-form>
      </div>
    `;
    const form = this.querySelector("ha-form");
    if (!form) {
      return;
    }
    this._form = form;
    this._form.addEventListener("value-changed", this._boundOnChange);
  }
  _buildFormSchema() {
    return buildFormSchema(this._entries);
  }
  _onChange(e) {
    const detail = e.detail;
    const entryId = detail.value?.entry_id ?? this._config?.entry_id ?? "";
    const themeValue = detail.value?.theme ?? this._config?.theme ?? "dark";
    const theme = normalizeTheme(themeValue);
    if (this._config?.entry_id === entryId && this._config?.theme === theme) {
      return;
    }
    this._updateConfig({ entry_id: entryId, theme });
  }
  _updateConfigEntry(entryId) {
    const selectedTheme = this._config?.theme ?? "dark";
    this._updateConfig({ entry_id: entryId, theme: selectedTheme });
  }
  _updateConfig(update) {
    this._config = {
      ...this._config,
      type: "custom:unifi-network-map",
      entry_id: update.entry_id,
      theme: update.theme
    };
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true
      })
    );
  }
};

// src/unifi-network-map.ts
var CARD_VERSION = "0.1.5";
customElements.define("unifi-network-map", UnifiNetworkMapCard);
customElements.define("unifi-network-map-editor", UnifiNetworkMapEditor);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "unifi-network-map",
  name: "UniFi Network Map",
  description: "Displays your UniFi network topology as an interactive SVG map"
});
console.info(`unifi-network-map card loaded v${CARD_VERSION}`);
/*! Bundled license information:

dompurify/dist/purify.es.mjs:
  (*! @license DOMPurify 3.3.1 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.3.1/LICENSE *)
*/
