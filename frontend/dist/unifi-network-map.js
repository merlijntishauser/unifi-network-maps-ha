// src/card/shared/constants.ts
var DOMAIN = "unifi_network_map";
var MIN_PAN_MOVEMENT_THRESHOLD = 6;
var ZOOM_INCREMENT = 0.1;
var MIN_ZOOM_SCALE = 0.5;
var MAX_ZOOM_SCALE = 5;
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
  ADD_TAGS: ["svg", "path", "circle", "line", "polyline", "polygon", "rect", "g", "use", "defs"],
  ADD_ATTR: [
    // Data attributes
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
    "data-ip",
    "data-modal-overlay",
    "data-modal-entity-id",
    "data-filter-type",
    // SVG attributes
    "viewBox",
    "fill",
    "stroke",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "d",
    "cx",
    "cy",
    "r",
    "x",
    "y",
    "width",
    "height",
    "focusable"
  ]
};
function sanitizeHtml(markup) {
  return purify.sanitize(markup, DOMPURIFY_CONFIG);
}
function sanitizeSvg(svg3) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg3, "image/svg+xml");
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
function annotateEdges(svg3, edges) {
  const edgesByKey = buildEdgeLookup(edges);
  const paths = svg3.querySelectorAll("path[data-edge-left][data-edge-right]");
  paths.forEach((path) => {
    const left = path.getAttribute("data-edge-left");
    const right = path.getAttribute("data-edge-right");
    if (!left || !right) return;
    const edge = edgesByKey.get(edgeKey(left, right));
    if (!edge) return;
    path.setAttribute("data-edge", "true");
    ensureEdgeHitbox(path, edge);
  });
  annotateEdgeLabels(svg3);
}
function annotateEdgeLabels(svg3) {
  const edgeLabels = svg3.querySelectorAll(".edgeLabel");
  edgeLabels.forEach((label) => annotateElementWithEdge(label, svg3));
  annotatePoeIcons(svg3);
}
function annotateElementWithEdge(element, svg3) {
  if (element.hasAttribute("data-edge-left")) return;
  const edgePath = findNearestEdgePath(element, svg3);
  if (edgePath) {
    const left = edgePath.getAttribute("data-edge-left");
    const right = edgePath.getAttribute("data-edge-right");
    if (left && right) {
      element.setAttribute("data-edge-left", left);
      element.setAttribute("data-edge-right", right);
    }
  }
}
function annotatePoeIcons(svg3) {
  const textElements = svg3.querySelectorAll("text");
  for (const text2 of textElements) {
    if (!isPoeLabel(text2.textContent)) {
      continue;
    }
    annotateElementWithEdge(text2, svg3);
    annotatePoeParent(text2);
  }
  const useElements = svg3.querySelectorAll('use[href*="poe-bolt"]');
  for (const el of useElements) {
    annotateElementWithEdge(el, svg3);
    annotatePoeParent(el);
  }
}
function isPoeLabel(text2) {
  const content = text2?.trim() ?? "";
  if (!content) {
    return false;
  }
  return content === "\u26A1" || content === "\u26A1\uFE0F" || content.toLowerCase() === "poe";
}
function annotatePoeParent(text2) {
  const parentGroup = text2.closest("g");
  if (!parentGroup || parentGroup.hasAttribute("data-edge-left")) {
    return;
  }
  const left = text2.getAttribute("data-edge-left");
  const right = text2.getAttribute("data-edge-right");
  if (left && right) {
    parentGroup.setAttribute("data-edge-left", left);
    parentGroup.setAttribute("data-edge-right", right);
  }
}
function findNearestEdgePath(label, svg3) {
  return findEdgePathInGroup(label) ?? findEdgePathByLabelText(label, svg3) ?? findEdgePathByPosition(label, svg3);
}
function getLabelPosition(element) {
  let current = element;
  while (current && current.tagName !== "svg") {
    const transform = current.getAttribute("transform");
    if (transform) {
      const translateMatch = transform.match(/translate\s*\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/);
      if (translateMatch) {
        return { x: parseFloat(translateMatch[1]), y: parseFloat(translateMatch[2]) };
      }
    }
    current = current.parentElement;
  }
  const x = element.getAttribute("x");
  const y = element.getAttribute("y");
  if (x && y) {
    return { x: parseFloat(x), y: parseFloat(y) };
  }
  try {
    const svgEl = element;
    if (typeof svgEl.getBBox === "function") {
      const bbox = svgEl.getBBox();
      return { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
    }
  } catch {
  }
  return null;
}
function findClosestEdgeByPosition(svg3, pos) {
  const paths = svg3.querySelectorAll("path[data-edge-left][data-edge-right]");
  let closest = null;
  let minDist = Infinity;
  for (const path of paths) {
    const pathEl = path;
    try {
      const length = pathEl.getTotalLength();
      for (const ratio of [0.25, 0.5, 0.75]) {
        const point = pathEl.getPointAtLength(length * ratio);
        const dist = Math.hypot(point.x - pos.x, point.y - pos.y);
        if (dist < minDist) {
          minDist = dist;
          closest = path;
        }
      }
    } catch {
    }
  }
  return minDist < 150 ? closest : null;
}
function findEdgePathInGroup(label) {
  const parentGroup = label.closest("g");
  if (!parentGroup) {
    return null;
  }
  const siblingPath = parentGroup.querySelector("path[data-edge-left][data-edge-right]");
  if (siblingPath) {
    return siblingPath;
  }
  const grandparent = parentGroup.parentElement;
  if (!grandparent) {
    return null;
  }
  return grandparent.querySelector("path[data-edge-left][data-edge-right]");
}
function findEdgePathByLabelText(label, svg3) {
  const labelText = label.textContent?.trim() ?? "";
  if (!labelText) {
    return null;
  }
  const paths = svg3.querySelectorAll("path[data-edge-left][data-edge-right]");
  for (const path of paths) {
    const left = path.getAttribute("data-edge-left") ?? "";
    const right = path.getAttribute("data-edge-right") ?? "";
    if (labelText.includes(left) || labelText.includes(right)) {
      return path;
    }
  }
  return null;
}
function findEdgePathByPosition(label, svg3) {
  const labelTransform = getLabelPosition(label);
  if (!labelTransform) {
    return null;
  }
  return findClosestEdgeByPosition(svg3, labelTransform);
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
function renderEdgeTooltip(edge, getIcon, localize) {
  const connectionType = edge.wireless ? localize("edge_tooltip.wireless") : localize("edge_tooltip.wired");
  const icon = edge.wireless ? getIcon("edge-wireless") : getIcon("edge-wired");
  const rows = [];
  rows.push(
    `<div class="tooltip-edge__title">${escapeHtml(edge.left)} \u2194 ${escapeHtml(edge.right)}</div>`
  );
  rows.push(
    `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">${icon}</span><span class="tooltip-edge__label">${connectionType}</span></div>`
  );
  if (edge.label) {
    rows.push(
      `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">${getIcon("edge-port")}</span><span class="tooltip-edge__label">${escapeHtml(edge.label)}</span></div>`
    );
  }
  if (edge.poe) {
    rows.push(
      `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">${getIcon("edge-poe")}</span><span class="tooltip-edge__label">${localize("edge_tooltip.poe")}</span></div>`
    );
  }
  if (edge.speed) {
    rows.push(
      `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">${getIcon("edge-speed")}</span><span class="tooltip-edge__label">${formatSpeed(edge.speed, localize)}</span></div>`
    );
  }
  if (edge.channel) {
    rows.push(
      `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">${getIcon("edge-channel")}</span><span class="tooltip-edge__label">${formatChannel(edge.channel, localize)}</span></div>`
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
function formatSpeed(speedMbps, localize) {
  if (speedMbps >= 1e3) {
    const gbps = (speedMbps / 1e3).toFixed(1).replace(/\.0$/, "");
    return localize("edge_tooltip.speed_gbps", { speed: gbps });
  }
  return localize("edge_tooltip.speed_mbps", { speed: speedMbps });
}
function formatChannel(channel, localize) {
  const band = channelBand(channel, localize);
  const suffix = band ? ` (${band})` : "";
  return localize("edge_tooltip.channel", { channel, suffix });
}
function channelBand(channel, localize) {
  if (channel >= 1 && channel <= 14) {
    return localize("edge_tooltip.band_24");
  }
  if (channel >= 36 && channel <= 177) {
    return localize("edge_tooltip.band_5");
  }
  if (channel >= 1) {
    return localize("edge_tooltip.band_6");
  }
  return null;
}

// src/card/data/annotation-cache.ts
function createAnnotationCache() {
  return {
    lastKey: null,
    isAnnotated: false
  };
}
function hashString(str) {
  let hash = 0;
  if (str.length === 0) return String(hash);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return String(hash);
}
function buildCacheKey(svgContent, nodeTypes, edges) {
  const nodeTypesStr = nodeTypes ? JSON.stringify(Object.keys(nodeTypes).sort()) : "";
  const edgesStr = edges ? JSON.stringify(edges.map((e) => `${e.left}-${e.right}`).sort()) : "";
  return {
    svgHash: hashString(svgContent),
    nodeTypesHash: hashString(nodeTypesStr),
    edgesHash: hashString(edgesStr)
  };
}
function cacheKeysEqual(a, b) {
  if (a === null || b === null) return false;
  return a.svgHash === b.svgHash && a.nodeTypesHash === b.nodeTypesHash && a.edgesHash === b.edgesHash;
}
function shouldSkipAnnotations(cache, currentKey) {
  return cache.isAnnotated && cacheKeysEqual(cache.lastKey, currentKey);
}
function markAnnotationsComplete(cache, key) {
  cache.lastKey = key;
  cache.isAnnotated = true;
}
function invalidateAnnotationCache(cache) {
  cache.lastKey = null;
  cache.isAnnotated = false;
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
  const resolvers = [
    resolveFromDataNodeId,
    resolveFromAriaLabel,
    resolveFromText,
    resolveFromGroupTitle,
    resolveFromGroupText,
    resolveFromElementId
  ];
  for (const resolver of resolvers) {
    const value = resolver(target);
    if (value) {
      return value;
    }
  }
  return null;
}
function findNodeElement(svg3, nodeName) {
  return findByDataNodeId(svg3, nodeName) ?? findByAriaLabel(svg3, nodeName) ?? findByTextContent(svg3, nodeName) ?? findByTitleElement(svg3, nodeName);
}
function highlightSelectedNode(svg3, selectedNode) {
  clearNodeSelection(svg3);
  if (!selectedNode) {
    return;
  }
  const element = findNodeElement(svg3, selectedNode);
  if (element) {
    markNodeSelected(element);
  }
}
function clearNodeSelection(svg3) {
  svg3.querySelectorAll("[data-selected]").forEach((el) => {
    el.removeAttribute("data-selected");
  });
  svg3.querySelectorAll(".node--selected").forEach((el) => {
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
function annotateNodeIds(svg3, nodeNames) {
  if (!nodeNames.length) {
    return;
  }
  const textMap = buildTextMap(svg3, "text");
  const titleMap = buildTextMap(svg3, "title");
  for (const name of nodeNames) {
    const holder = findNodeHolder(svg3, name, textMap, titleMap);
    if (!holder) {
      continue;
    }
    holder.setAttribute("data-node-id", name);
  }
}
function removeSvgTitles(svg3) {
  svg3.querySelectorAll("title").forEach((el) => el.remove());
}
function buildTextMap(svg3, selector) {
  const map = /* @__PURE__ */ new Map();
  for (const el of svg3.querySelectorAll(selector)) {
    const text2 = el.textContent?.trim();
    if (!text2) continue;
    const list = map.get(text2) ?? [];
    list.push(el);
    map.set(text2, list);
  }
  return map;
}
function findNodeHolder(svg3, name, textMap, titleMap) {
  if (!name) {
    return null;
  }
  if (svg3.querySelector(`[data-node-id="${CSS.escape(name)}"]`)) {
    return null;
  }
  const target = findNodeTarget(svg3, name, textMap, titleMap);
  if (!target) {
    return null;
  }
  return target.closest("g") ?? target;
}
function findNodeTarget(svg3, name, textMap, titleMap) {
  return svg3.querySelector(`[aria-label="${CSS.escape(name)}"]`) ?? textMap.get(name)?.[0] ?? titleMap.get(name)?.[0] ?? null;
}
function findByDataNodeId(svg3, nodeName) {
  const el = svg3.querySelector(`[data-node-id="${CSS.escape(nodeName)}"]`);
  return el ? el.closest("g") ?? el : null;
}
function findByAriaLabel(svg3, nodeName) {
  const el = svg3.querySelector(`[aria-label="${CSS.escape(nodeName)}"]`);
  return el ? el.closest("g") ?? el : null;
}
function findByTextContent(svg3, nodeName) {
  for (const textEl of svg3.querySelectorAll("text")) {
    if (textEl.textContent?.trim() === nodeName) {
      return textEl.closest("g") ?? textEl;
    }
  }
  return null;
}
function findByTitleElement(svg3, nodeName) {
  for (const titleEl of svg3.querySelectorAll("title")) {
    if (titleEl.textContent?.trim() === nodeName) {
      return titleEl.closest("g");
    }
  }
  return null;
}
function resolveFromDataNodeId(target) {
  const node = target.closest("[data-node-id]");
  return node?.getAttribute("data-node-id")?.trim() ?? null;
}
function resolveFromAriaLabel(target) {
  const labelled = target.closest("[aria-label]");
  return labelled?.getAttribute("aria-label")?.trim() ?? null;
}
function resolveFromText(target) {
  const textNode = target.closest("text");
  return textNode?.textContent?.trim() ?? null;
}
function resolveFromGroupTitle(target) {
  const group = target.closest("g");
  const title = group?.querySelector("title");
  return title?.textContent?.trim() ?? null;
}
function resolveFromGroupText(target) {
  const group = target.closest("g");
  const groupText = group?.querySelector("text");
  return groupText?.textContent?.trim() ?? null;
}
function resolveFromElementId(target) {
  const idHolder = target.closest("[id]");
  return idHolder?.getAttribute("id")?.trim() ?? null;
}

// src/card/ui/icons.ts
var EMOJI_ICONS = {
  network: "\u{1F4E1}",
  hint: "\u{1F4A1}",
  "node-gateway": "\u{1F310}",
  "node-switch": "\u{1F500}",
  "node-ap": "\u{1F4F6}",
  "node-client": "\u{1F4BB}",
  "node-other": "\u{1F4E6}",
  "node-camera": "\u{1F4F7}",
  "node-tv": "\u{1F4FA}",
  "node-phone": "\u{1F4F1}",
  "node-printer": "\u{1F5A8}\uFE0F",
  "node-nas": "\u{1F4BE}",
  "node-speaker": "\u{1F50A}",
  "node-game_console": "\u{1F3AE}",
  "node-iot": "\u{1F50C}",
  "node-client_cluster": "\u{1F465}",
  "action-details": "\u{1F4CA}",
  "action-copy": "\u{1F4CB}",
  "action-ports": "\u{1F50C}",
  "menu-details": "\u{1F4CA}",
  "menu-copy": "\u{1F4CB}",
  "menu-copy-ip": "\u{1F4C4}",
  "menu-restart": "\u{1F504}",
  "menu-ports": "\u{1F50C}",
  "edge-wired": "\u{1F517}",
  "edge-wireless": "\u{1F4F6}",
  "edge-port": "\u{1F50C}",
  "edge-poe": "\u26A1",
  "edge-speed": "\u{1F680}",
  "edge-channel": "\u{1F4E1}",
  "domain-device_tracker": "\u{1F4CD}",
  "domain-switch": "\u{1F518}",
  "domain-sensor": "\u{1F4CA}",
  "domain-binary_sensor": "\u26A1",
  "domain-light": "\u{1F4A1}",
  "domain-button": "\u{1F532}",
  "domain-update": "\u{1F504}",
  "domain-image": "\u{1F5BC}\uFE0F",
  "domain-default": "\u{1F4E6}"
};
var HERO_SVGS = {
  network: svg2(
    ["M2.5 8.5a13 13 0 0119 0", "M5.5 11.5a9 9 0 0113 0", "M8.5 14.5a5 5 0 017 0"],
    [{ cx: 12, cy: 18, r: 1 }]
  ),
  hint: svg2([
    "M12 3a6 6 0 00-3.6 10.8c.4.3.6.8.6 1.3V17a1 1 0 001 1h4a1 1 0 001-1v-1.9c0-.5.2-1 .6-1.3A6 6 0 0012 3z",
    "M9 20h6"
  ]),
  "node-gateway": svg2(
    ["M3 12h18", "M12 3c-2.8 0-5 4-5 9s2.2 9 5 9 5-4 5-9-2.2-9-5-9z"],
    [{ cx: 12, cy: 12, r: 9 }]
  ),
  "node-switch": svg2(["M7 7h10l-3-3m3 3-3 3", "M17 17H7l3-3m-3 3 3 3"]),
  "node-ap": svg2(
    ["M4 9a11 11 0 0116 0", "M7 12a7 7 0 0110 0", "M10 15a3 3 0 014 0"],
    [{ cx: 12, cy: 18, r: 1 }]
  ),
  "node-client": svg2(["M4 6h16v9H4z", "M10 19h4", "M12 15v4"]),
  "node-other": svg2(["M12 3 4 7 12 11 20 7 12 3z", "M4 7v10l8 4 8-4V7", "M12 11v10"]),
  "node-camera": svg2(
    ["M3 9a2 2 0 012-2h1l1-2h10l1 2h1a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"],
    [{ cx: 12, cy: 13, r: 3 }]
  ),
  "node-tv": svg2(["M4 7h16v10H4z", "M9 21l3-4 3 4"]),
  "node-phone": svg2([
    "M7 2h10a1 1 0 011 1v18a1 1 0 01-1 1H7a1 1 0 01-1-1V3a1 1 0 011-1z",
    "M11 18h2"
  ]),
  "node-printer": svg2([
    "M6 9V2h12v7",
    "M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2",
    "M6 14h12v8H6z"
  ]),
  "node-nas": svg2(["M4 5h16v14H4z", "M4 9h16", "M4 13h16", "M7 11h1", "M7 15h1"]),
  "node-speaker": svg2(
    ["M6 5h12v14a2 2 0 01-2 2H8a2 2 0 01-2-2V5z", "M6 5a2 2 0 012-2h8a2 2 0 012 2"],
    [{ cx: 12, cy: 14, r: 3 }]
  ),
  "node-game_console": svg2([
    "M6 11h4m-2-2v4",
    "M15 13h.01",
    "M18 11h.01",
    "M4 8h16a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2z"
  ]),
  "node-iot": svg2(
    [
      "M12 2v6",
      "M12 22v-6",
      "M4.93 4.93l4.24 4.24",
      "M14.83 14.83l4.24 4.24",
      "M2 12h6",
      "M16 12h6",
      "M4.93 19.07l4.24-4.24",
      "M14.83 9.17l4.24-4.24"
    ],
    [{ cx: 12, cy: 12, r: 2 }]
  ),
  "node-client_cluster": svg2(
    ["M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2", "M22 21v-2a4 4 0 00-3-3.87"],
    [
      { cx: 9, cy: 7, r: 4 },
      { cx: 19, cy: 7, r: 3 }
    ]
  ),
  "action-details": svg2(["M4 4h16v16H4z", "M8 16v-4", "M12 16v-7", "M16 16v-2"]),
  "action-copy": svg2(["M8 4h8v3H8z", "M6 7h12v13H6z"]),
  "action-ports": svg2([
    "M5 5h4v4H5z",
    "M15 5h4v4h-4z",
    "M5 15h4v4H5z",
    "M15 15h4v4h-4z",
    "M9 7h6",
    "M9 17h6",
    "M7 9v6",
    "M17 9v6"
  ]),
  "menu-details": svg2(["M4 4h16v16H4z", "M8 16v-4", "M12 16v-7", "M16 16v-2"]),
  "menu-copy": svg2(["M8 4h8v3H8z", "M6 7h12v13H6z"]),
  "menu-copy-ip": svg2(["M4 10h16", "M4 14h16", "M8 6h8", "M8 18h8"]),
  "menu-restart": svg2(["M3 12a9 9 0 0115-6l2-2v6h-6l2-2a6 6 0 10 1 8"]),
  "menu-ports": svg2([
    "M5 5h4v4H5z",
    "M15 5h4v4h-4z",
    "M5 15h4v4H5z",
    "M15 15h4v4h-4z",
    "M9 7h6",
    "M9 17h6",
    "M7 9v6",
    "M17 9v6"
  ]),
  "edge-wired": svg2(["M8 12a3 3 0 013-3h2", "M16 12a3 3 0 01-3 3h-2", "M10 12h4"]),
  "edge-wireless": svg2(
    ["M4 9a11 11 0 0116 0", "M7 12a7 7 0 0110 0", "M10 15a3 3 0 014 0"],
    [{ cx: 12, cy: 18, r: 1 }]
  ),
  "edge-port": svg2(["M9 7v4", "M15 7v4", "M7 11h10", "M12 11v7", "M9 18h6"]),
  "edge-poe": svg2(["M13 2L6 14h5l-1 8 7-12h-5l1-8z"]),
  "edge-speed": svg2(["M4 14l6-6 4 4 6-6", "M16 6h4v4"]),
  "edge-channel": svg2(["M4 18v-2", "M8 18v-4", "M12 18v-6", "M16 18v-8", "M20 18v-10"]),
  "domain-device_tracker": svg2(
    ["M12 21c4-5 6-8 6-11a6 6 0 10-12 0c0 3 2 6 6 11z"],
    [{ cx: 12, cy: 10, r: 2 }]
  ),
  "domain-switch": svg2(["M5 12h14", "M8 12a3 3 0 100-6", "M16 12a3 3 0 110 6"]),
  "domain-sensor": svg2(["M4 16h4v-4H4z", "M10 16h4V8h-4z", "M16 16h4v-7h-4z"]),
  "domain-binary_sensor": svg2(["M13 2L6 14h5l-1 8 7-12h-5l1-8z"]),
  "domain-light": svg2([
    "M12 3a6 6 0 00-3.6 10.8c.4.3.6.8.6 1.3V17a1 1 0 001 1h4a1 1 0 001-1v-1.9c0-.5.2-1 .6-1.3A6 6 0 0012 3z",
    "M9 20h6"
  ]),
  "domain-button": svg2(["M6 6h12v12H6z"], [{ cx: 12, cy: 12, r: 2 }]),
  "domain-update": svg2(["M3 12a9 9 0 0115-6l2-2v6h-6l2-2a6 6 0 10 1 8"]),
  "domain-image": svg2(["M4 6h16v12H4z", "M8 14l3-3 3 3 3-4 3 4"], [{ cx: 9, cy: 10, r: 1.5 }]),
  "domain-default": svg2(["M12 3 4 7 12 11 20 7 12 3z", "M4 7v10l8 4 8-4V7", "M12 11v10"])
};
function iconMarkup(name, theme) {
  const isUnifi = theme === "unifi" || theme === "unifi-dark";
  if (!isUnifi) {
    return `<span class="unifi-icon unifi-icon--emoji" aria-hidden="true">${EMOJI_ICONS[name]}</span>`;
  }
  return `<span class="unifi-icon unifi-icon--hero" aria-hidden="true">${HERO_SVGS[name]}</span>`;
}
var NODE_TYPE_ICONS = {
  gateway: "node-gateway",
  switch: "node-switch",
  ap: "node-ap",
  client: "node-client",
  camera: "node-camera",
  tv: "node-tv",
  phone: "node-phone",
  printer: "node-printer",
  nas: "node-nas",
  speaker: "node-speaker",
  game_console: "node-game_console",
  iot: "node-iot",
  client_cluster: "node-client_cluster"
};
function nodeTypeIcon(nodeType, theme) {
  return iconMarkup(NODE_TYPE_ICONS[nodeType] ?? "node-other", theme);
}
function domainIcon(domain, theme) {
  const nameMap = {
    device_tracker: "domain-device_tracker",
    switch: "domain-switch",
    sensor: "domain-sensor",
    binary_sensor: "domain-binary_sensor",
    light: "domain-light",
    button: "domain-button",
    update: "domain-update",
    image: "domain-image"
  };
  return iconMarkup(nameMap[domain] ?? "domain-default", theme);
}
function svg2(paths, circles = []) {
  const pathMarkup = paths.map((d) => `<path d="${d}"></path>`).join("");
  const circleMarkup = circles.map((circle) => `<circle cx="${circle.cx}" cy="${circle.cy}" r="${circle.r}"></circle>`).join("");
  return `<svg viewBox="0 0 24 24" width="16" height="16" style="width:16px;height:16px;display:inline-block;vertical-align:middle;" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${pathMarkup}${circleMarkup}</svg>`;
}

// src/card/ui/entity-modal.ts
function renderEntityModal(context) {
  const data = buildEntityModalData(context);
  return renderEntityModalMarkup(data, context);
}
function renderEntityItem(entity, theme, nodeName) {
  const domainIconMarkup = domainIcon(entity.domain, theme);
  const displayName = getCompactDisplayName(entity, nodeName);
  const safeDisplayName = escapeHtml(displayName);
  const safeEntityId = escapeHtml(entity.entity_id);
  const compactEntityId = getCompactEntityId(entity.entity_id);
  const formattedState = formatEntityState(entity);
  const stateClass = getStateBadgeClass(formattedState.normalized);
  return `
    <div class="entity-modal__entity-item" data-modal-entity-id="${safeEntityId}">
      <span class="entity-modal__domain-icon">${domainIconMarkup}</span>
      <div class="entity-modal__entity-info">
        <span class="entity-modal__entity-name" title="${safeDisplayName}">${safeDisplayName}</span>
        <span class="entity-modal__entity-id" title="${safeEntityId}">${escapeHtml(compactEntityId)}</span>
      </div>
      <div class="entity-modal__entity-state">
        <span class="entity-modal__state-badge ${stateClass}">${escapeHtml(formattedState.display)}</span>
        <span class="entity-modal__arrow">\u203A</span>
      </div>
    </div>
  `;
}
function getCompactDisplayName(entity, nodeName) {
  const fullName = entity.friendly_name ?? entity.entity_id;
  const lowerName = fullName.toLowerCase();
  const lowerNodeName = nodeName.toLowerCase();
  if (lowerName.startsWith(lowerNodeName + " ")) {
    const stripped = fullName.substring(nodeName.length + 1).trim();
    if (stripped.length > 0) {
      return capitalizeFirst(stripped);
    }
  }
  const normalizedNode = nodeName.replace(/[\s_-]+/g, " ").toLowerCase();
  const normalizedFull = fullName.replace(/[\s_-]+/g, " ").toLowerCase();
  if (normalizedFull.startsWith(normalizedNode + " ")) {
    const prefixLen = normalizedNode.length + 1;
    const stripped = fullName.replace(/[\s_-]+/g, " ").substring(prefixLen).trim();
    if (stripped.length > 0) {
      return capitalizeFirst(stripped);
    }
  }
  return fullName;
}
function getCompactEntityId(entityId) {
  const parts = entityId.split(".");
  if (parts.length !== 2) return entityId;
  const domain = parts[0];
  const objectId = parts[1];
  const domainAbbr = {
    sensor: "sensor",
    binary_sensor: "binary",
    device_tracker: "tracker",
    switch: "switch",
    button: "button",
    update: "update",
    number: "number",
    select: "select"
  };
  const abbr = domainAbbr[domain] ?? domain;
  return `${abbr}.${objectId}`;
}
var SIMPLE_STATES = ["on", "off", "home", "not_home", "unavailable", "unknown"];
var ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T/;
var MAC_ADDRESS_PATTERN = /^([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}$/;
var NUMERIC_PATTERN = /^-?\d+(\.\d+)?$/;
function formatEntityState(entity) {
  const state = entity.state ?? "unavailable";
  const domain = entity.domain ?? "";
  const lowerState = state.toLowerCase();
  if (SIMPLE_STATES.includes(lowerState)) {
    return { display: capitalizeFirst(state), normalized: lowerState };
  }
  const sensorResult = formatSensorState(state, domain, entity.entity_id);
  if (sensorResult) return sensorResult;
  const domainResult = formatDomainSpecificState(state, domain);
  if (domainResult) return domainResult;
  return formatFallbackState(state);
}
function formatSensorState(state, domain, entityId) {
  if (domain !== "sensor" && domain !== "binary_sensor") return null;
  if (ISO_TIMESTAMP_PATTERN.test(state)) {
    return { display: formatTimestamp(state), normalized: "default" };
  }
  if (MAC_ADDRESS_PATTERN.test(state)) {
    return { display: state.substring(0, 8) + "\u2026", normalized: "default" };
  }
  if (NUMERIC_PATTERN.test(state)) {
    return formatNumericState(state, entityId);
  }
  return null;
}
function formatNumericState(state, entityId) {
  const num = parseFloat(state);
  const unit = inferUnitFromEntityId(entityId);
  if (Math.abs(num) >= 1e6) {
    return { display: formatLargeNumber(num) + unit, normalized: "default" };
  }
  const formatted = Number.isInteger(num) ? num.toString() : num.toFixed(1);
  return { display: formatted + unit, normalized: "default" };
}
var UNIT_PATTERNS = [
  { patterns: ["utilization", "percent", "_pct"], unit: "%" },
  { patterns: ["temperature", "_temp"], unit: "\xB0C" },
  { patterns: ["_power"], unit: " W", exclude: ["power_mode"] },
  { patterns: ["_voltage"], unit: " V" },
  { patterns: ["_current"], unit: " A", exclude: ["current_"] },
  { patterns: ["_speed", "bandwidth"], unit: " Mbps" },
  { patterns: ["_bytes", "_data"], unit: " B" },
  { patterns: ["uptime"], unit: " s" }
];
function inferUnitFromEntityId(entityId) {
  const objectId = entityId.split(".")[1] ?? entityId;
  const lower = objectId.toLowerCase();
  for (const { patterns, unit, exclude } of UNIT_PATTERNS) {
    const matches = patterns.some((p) => lower.includes(p));
    const excluded = exclude?.some((e) => lower.includes(e)) ?? false;
    if (matches && !excluded) {
      return unit;
    }
  }
  return "";
}
function formatDomainSpecificState(state, domain) {
  if (domain === "button") {
    return { display: "\u2014", normalized: "default" };
  }
  if (domain === "update") {
    if (state === "off") return { display: "Up to date", normalized: "off" };
    if (state === "on") return { display: "Update", normalized: "on" };
  }
  return null;
}
function formatFallbackState(state) {
  if (state.length > 12) {
    return { display: state.substring(0, 10) + "\u2026", normalized: "default" };
  }
  return { display: capitalizeFirst(state), normalized: state.toLowerCase() };
}
function capitalizeFirst(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
function formatTimestamp(iso) {
  try {
    const date = new Date(iso);
    const now = /* @__PURE__ */ new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 6e4);
    const diffHours = Math.floor(diffMs / 36e5);
    const diffDays = Math.floor(diffMs / 864e5);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return "\u2014";
  }
}
function formatLargeNumber(num) {
  if (Math.abs(num) >= 1e9) {
    return (num / 1e9).toFixed(1) + "B";
  }
  if (Math.abs(num) >= 1e6) {
    return (num / 1e6).toFixed(1) + "M";
  }
  if (Math.abs(num) >= 1e3) {
    return (num / 1e3).toFixed(1) + "K";
  }
  return num.toString();
}
function getStateBadgeClass(state) {
  if (state === "home" || state === "on" || state === "connected") {
    return "entity-modal__state-badge--on";
  }
  if (state === "not_home" || state === "off" || state === "disconnected") {
    return "entity-modal__state-badge--off";
  }
  return "entity-modal__state-badge--default";
}
function buildEntityModalData(context) {
  const nodeName = context.nodeName;
  const mac = getNodeMac(context.payload, nodeName);
  const model = getNodeModel(context.payload, nodeName);
  const nodeType = getNodeType(context.payload, nodeName);
  const status = context.payload?.node_status?.[nodeName];
  const relatedEntities = context.payload?.related_entities?.[nodeName] ?? [];
  return {
    safeName: escapeHtml(nodeName),
    nodeType,
    status,
    relatedEntities,
    typeIcon: context.getNodeTypeIcon(nodeType),
    infoRows: buildEntityInfoRows({ mac, model, status, nodeType, relatedEntities, context }),
    entityItems: relatedEntities.map((entity) => renderEntityItem(entity, context.theme, nodeName)).join(""),
    theme: context.theme
  };
}
function renderEntityModalMarkup(data, context) {
  return `
    <div class="entity-modal-overlay" data-modal-overlay data-theme="${escapeHtml(data.theme)}">
      <div class="entity-modal">
        <div class="entity-modal__header">
          <div class="entity-modal__title">
            <span>${data.typeIcon}</span>
            <span>${data.safeName}</span>
          </div>
          <button type="button" class="entity-modal__close" data-action="close-modal">&times;</button>
        </div>
        <div class="entity-modal__body">
          <div class="entity-modal__section">
            <div class="entity-modal__section-title">${context.localize("entity_modal.device_info")}</div>
            <div class="entity-modal__info-grid">
              ${data.infoRows.join("")}
            </div>
          </div>
          ${renderRelatedEntitiesSection(data.relatedEntities, data.entityItems, context)}
        </div>
      </div>
    </div>
  `;
}
function buildEntityInfoRows(input) {
  const { mac, model, status, nodeType, relatedEntities, context } = input;
  const infoRows = [];
  pushIf(infoRows, renderModelRow(model, context));
  pushIf(infoRows, renderMacRow(mac, context));
  pushIf(infoRows, renderIpRow(relatedEntities, context));
  pushIf(infoRows, renderStatusRow(status, context));
  pushIf(infoRows, renderLastChangedRow(status, context));
  infoRows.push(renderDeviceTypeRow(nodeType, context));
  return infoRows;
}
function getNodeMac(payload, nodeName) {
  return payload?.client_macs?.[nodeName] ?? payload?.device_macs?.[nodeName];
}
function getNodeType(payload, nodeName) {
  return payload?.node_types?.[nodeName] ?? "unknown";
}
function getNodeModel(payload, nodeName) {
  const details = payload?.device_details?.[nodeName];
  if (!details) return void 0;
  return details.model_name ?? details.model ?? void 0;
}
function renderModelRow(model, context) {
  if (!model) {
    return null;
  }
  return `
    <div class="entity-modal__info-row">
      <span class="entity-modal__info-label">${context.localize("entity_modal.model")}</span>
      <span class="entity-modal__info-value">${escapeHtml(model)}</span>
    </div>
  `;
}
function renderMacRow(mac, context) {
  if (!mac) {
    return null;
  }
  return `
    <div class="entity-modal__info-row">
      <span class="entity-modal__info-label">${context.localize("entity_modal.mac")}</span>
      <span class="entity-modal__info-value">${escapeHtml(mac)}</span>
    </div>
  `;
}
function renderIpRow(relatedEntities, context) {
  const ipEntity = relatedEntities.find((entity) => entity.ip);
  if (!ipEntity?.ip) {
    return null;
  }
  return `
    <div class="entity-modal__info-row">
      <span class="entity-modal__info-label">${context.localize("entity_modal.ip")}</span>
      <span class="entity-modal__info-value">${escapeHtml(ipEntity.ip)}</span>
    </div>
  `;
}
function renderStatusRow(status, context) {
  if (!status?.state) {
    return null;
  }
  return `
    <div class="entity-modal__info-row">
      <span class="entity-modal__info-label">${context.localize("entity_modal.status")}</span>
      <span class="entity-modal__info-value">${getStatusLabel(status.state, context)}</span>
    </div>
  `;
}
function renderLastChangedRow(status, context) {
  if (!status?.last_changed) {
    return null;
  }
  return `
    <div class="entity-modal__info-row">
      <span class="entity-modal__info-label">${context.localize("entity_modal.last_changed")}</span>
      <span class="entity-modal__info-value">${context.formatLastChanged(status.last_changed)}</span>
    </div>
  `;
}
function renderDeviceTypeRow(nodeType, context) {
  return `
    <div class="entity-modal__info-row">
      <span class="entity-modal__info-label">${context.localize("entity_modal.device_type")}</span>
      <span class="entity-modal__info-value">${escapeHtml(nodeType)}</span>
    </div>
  `;
}
function getStatusLabel(state, context) {
  if (state === "online") {
    return context.localize("entity_modal.status_online");
  }
  if (state === "offline") {
    return context.localize("entity_modal.status_offline");
  }
  return context.localize("entity_modal.status_unknown");
}
function renderRelatedEntitiesSection(relatedEntities, entityItems, context) {
  if (!relatedEntities.length) {
    return `
      <div class="entity-modal__section">
        <div class="entity-modal__section-title">${context.localize("entity_modal.related_entities")}</div>
        <div class="panel-empty__text">${context.localize("entity_modal.no_entities")}</div>
      </div>
    `;
  }
  return `
    <div class="entity-modal__section">
      <div class="entity-modal__section-title">${context.localize("entity_modal.related_entities_count", { count: relatedEntities.length })}</div>
      <div class="entity-modal__entity-list">
        ${entityItems}
      </div>
    </div>
  `;
}
function pushIf(items, value) {
  if (value) {
    items.push(value);
  }
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
    formatLastChanged: params.formatLastChanged,
    localize: params.localize
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

// src/card/ui/port-modal.ts
function createPortModalController() {
  return { overlay: null, state: null };
}
function openPortModal(params) {
  const {
    controller,
    nodeName,
    payload,
    theme,
    getNodeTypeIcon,
    localize,
    onClose,
    onDeviceClick
  } = params;
  if (!payload) return;
  const nodeType = payload.node_types?.[nodeName] ?? "unknown";
  const ports = extractPortsForDevice(nodeName, payload);
  if (ports.length === 0) {
    return;
  }
  controller.state = { nodeName, nodeType, ports };
  const overlay = document.createElement("div");
  overlay.className = "port-modal-overlay";
  overlay.dataset.theme = theme;
  overlay.innerHTML = renderPortModal(controller.state, theme, getNodeTypeIcon, localize);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closePortModal(controller);
      onClose();
    }
  });
  const closeBtn = overlay.querySelector(".port-modal__close");
  closeBtn?.addEventListener("click", () => {
    closePortModal(controller);
    onClose();
  });
  const deviceLinks = overlay.querySelectorAll("[data-device-name]");
  deviceLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const deviceName = link.dataset.deviceName;
      if (deviceName) {
        closePortModal(controller);
        onDeviceClick(deviceName);
      }
    });
  });
  document.body.appendChild(overlay);
  controller.overlay = overlay;
}
function closePortModal(controller) {
  if (controller.overlay) {
    controller.overlay.remove();
    controller.overlay = null;
  }
  controller.state = null;
}
function buildConnectionMap(nodeName, payload) {
  const edges = payload.edges ?? [];
  const nodeTypes = payload.node_types ?? {};
  const connectedEdges = edges.filter((e) => e.left === nodeName || e.right === nodeName);
  const connectionMap = /* @__PURE__ */ new Map();
  for (const edge of connectedEdges) {
    const isLeft = edge.left === nodeName;
    const connectedDevice = isLeft ? edge.right : edge.left;
    const connectedDeviceType = nodeTypes[connectedDevice] ?? "unknown";
    const portNum = extractPortNumber(edge.label, isLeft);
    if (portNum !== null) {
      connectionMap.set(portNum, {
        device: connectedDevice,
        type: connectedDeviceType,
        poe: edge.poe ?? false,
        speed: edge.speed ?? null
      });
    }
  }
  return connectionMap;
}
function extractPortsForDevice(nodeName, payload) {
  const devicePorts = payload.device_ports?.[nodeName] ?? [];
  const connectionMap = buildConnectionMap(nodeName, payload);
  if (devicePorts.length > 0) {
    return devicePorts.map((dp) => {
      const connection = connectionMap.get(dp.port);
      return {
        port: dp.port,
        connectedDevice: connection?.device ?? null,
        connectedDeviceType: connection?.type ?? null,
        poe: dp.poe_enabled,
        poeActive: dp.poe_active,
        poePower: dp.poe_power,
        speed: connection?.speed ?? dp.speed
      };
    });
  }
  return Array.from(connectionMap.entries()).map(([portNum, conn]) => ({
    port: portNum,
    connectedDevice: conn.device,
    connectedDeviceType: conn.type,
    poe: conn.poe,
    poeActive: conn.poe,
    poePower: null,
    speed: conn.speed
  })).sort((a, b) => a.port - b.port);
}
function extractPortNumber(label, isLeft) {
  if (!label) return null;
  const parts = label.split(" <-> ");
  let side = label;
  if (parts.length === 2) {
    side = isLeft ? parts[0] : parts[1];
  }
  const match = side.match(/Port\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}
function renderPortModal(state, theme, getNodeTypeIcon, localize) {
  const { nodeName, nodeType, ports } = state;
  const nodeIcon = getNodeTypeIcon(nodeType);
  const portRows = ports.map((port) => {
    const deviceIcon = port.connectedDeviceType ? getNodeTypeIcon(port.connectedDeviceType) : "";
    const deviceName = port.connectedDevice ?? "Empty";
    const isConnected = port.connectedDevice !== null;
    let poeBadge = "";
    if (port.poeActive && port.poePower !== null && port.poePower > 0) {
      poeBadge = `<span class="badge badge--poe">${formatPower(port.poePower)}</span>`;
    } else if (port.poe) {
      poeBadge = `<span class="badge badge--poe-inactive">${localize("panel.badge.poe")}</span>`;
    }
    return `
        <div class="port-row ${isConnected ? "port-row--connected" : "port-row--empty"}">
          <span class="port-row__number">${localize("port_modal.port", { port: port.port })}</span>
          <div class="port-row__device">
            ${isConnected ? `
                  <span class="port-row__device-icon">${deviceIcon}</span>
                  <a href="#" class="port-row__device-name" data-device-name="${escapeAttr(port.connectedDevice)}">${escapeHtml2(deviceName)}</a>
                ` : `<span class="port-row__empty">${localize("port_modal.empty")}</span>`}
          </div>
          <span class="port-row__badges">
            ${poeBadge}
            ${port.speed ? `<span class="badge badge--speed">${formatSpeed2(port.speed)}</span>` : ""}
          </span>
        </div>
      `;
  }).join("");
  return `
    <div class="port-modal">
      <div class="port-modal__header">
        <div class="port-modal__title">
          <span class="port-modal__icon">${nodeIcon}</span>
          <span>${escapeHtml2(nodeName)}</span>
        </div>
        <button type="button" class="port-modal__close">&times;</button>
      </div>
      <div class="port-modal__subtitle">${localize("port_modal.title")}</div>
      <div class="port-modal__body">
        <div class="port-list">
          ${portRows || `<div class="port-modal__empty">${localize("port_modal.no_ports")}</div>`}
        </div>
      </div>
    </div>
  `;
}
function formatSpeed2(speed) {
  if (speed >= 1e3) {
    return `${speed / 1e3}G`;
  }
  return `${speed}M`;
}
function formatPower(watts) {
  if (watts < 1) {
    return `${(watts * 1e3).toFixed(0)}mW`;
  }
  return `${watts.toFixed(1)}W`;
}
function escapeHtml2(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escapeAttr(str) {
  return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// src/card/shared/node-utils.ts
function getNodeIpFromPayload(payload, nodeName) {
  const direct = getDirectNodeIp(payload, nodeName);
  if (direct) {
    return direct;
  }
  return getRelatedNodeIp(payload, nodeName);
}
function getDirectNodeIp(payload, nodeName) {
  return payload?.client_ips?.[nodeName] ?? payload?.device_ips?.[nodeName] ?? null;
}
function getRelatedNodeIp(payload, nodeName) {
  const related = payload?.related_entities?.[nodeName];
  if (!related) {
    return null;
  }
  return related.find((entity) => entity.ip)?.ip ?? null;
}

// src/card/interaction/filter-state.ts
var CLIENT_SUBTYPES = [
  "client",
  "camera",
  "tv",
  "phone",
  "printer",
  "nas",
  "speaker",
  "game_console",
  "iot",
  "client_cluster"
];
function createFilterState() {
  return {
    gateway: true,
    switch: true,
    ap: true,
    client: true,
    other: true
  };
}
function toggleFilter(state, type) {
  return {
    ...state,
    [type]: !state[type]
  };
}
function enableFilter(state, type) {
  if (state[type]) {
    return state;
  }
  return {
    ...state,
    [type]: true
  };
}
function normalizeDeviceType(type) {
  if (type === "gateway" || type === "switch" || type === "ap") {
    return type;
  }
  if (CLIENT_SUBTYPES.includes(type)) {
    return "client";
  }
  return "other";
}

// src/card/ui/panel.ts
function renderPanelContent(context, helpers) {
  if (!context.selectedNode) {
    return renderMapOverview(context, helpers);
  }
  return renderNodePanel(context, context.selectedNode, helpers);
}
function renderMapOverview(context, helpers) {
  if (!context.payload) {
    return `
      <div class="panel-empty">
        <div class="panel-empty__icon">${helpers.getIcon("network")}</div>
        <div class="panel-empty__text">${helpers.localize("panel.loading")}</div>
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
      <div class="panel-header__title">${helpers.localize("panel.overview")}</div>
    </div>
    ${renderOverviewStatsGrid(nodes.length, edges.length, helpers)}
    ${renderOverviewStatusSection(statusCounts, helpers)}
    ${renderOverviewDeviceBreakdown(deviceCounts, helpers)}
    <div class="panel-hint">
      <span class="panel-hint__icon">${helpers.getIcon("hint")}</span>
      ${helpers.localize("panel.hint")}
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
        <div class="panel-empty__text">${helpers.localize("panel.no_data")}</div>
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
      <button type="button" class="panel-tab ${context.activeTab === "overview" ? "panel-tab--active" : ""}" data-tab="overview">${helpers.localize("panel.tabs.overview")}</button>
      <button type="button" class="panel-tab ${context.activeTab === "stats" ? "panel-tab--active" : ""}" data-tab="stats">${helpers.localize("panel.tabs.stats")}</button>
      <button type="button" class="panel-tab ${context.activeTab === "actions" ? "panel-tab--active" : ""}" data-tab="actions">${helpers.localize("panel.tabs.actions")}</button>
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
  const neighbors = edges.filter((edge) => edge.left === name || edge.right === name).map((edge) => {
    const isLeft = edge.left === name;
    const neighborName = isLeft ? edge.right : edge.left;
    const portInfo = extractPortInfo(edge.label, isLeft);
    return {
      name: neighborName,
      label: portInfo,
      portNumber: extractPortNumber2(portInfo),
      wireless: edge.wireless,
      poe: edge.poe
    };
  });
  const uniqueNeighbors = Array.from(
    new Map(neighbors.map((n) => [n.name, n])).values()
  );
  const sortedNeighbors = sortNeighborsByPort(uniqueNeighbors);
  const neighborList = sortedNeighbors.length ? sortedNeighbors.map((n) => renderNeighborItem(n, helpers)).join("") : `<div class="panel-empty__text">${helpers.localize("panel.no_connections")}</div>`;
  const relatedEntitiesSection = renderRelatedEntitiesSection2(context, name, helpers);
  const vlanSection = renderVlanSection(context, name, helpers);
  return `
    ${vlanSection}
    <div class="panel-section">
      <div class="panel-section__title">${helpers.localize("panel.connected_devices")}</div>
      <div class="neighbor-list neighbor-list--compact">${neighborList}</div>
    </div>
    ${relatedEntitiesSection}
  `;
}
function extractPortNumber2(portInfo) {
  if (!portInfo) return 999;
  const match = portInfo.match(/\d+/);
  return match ? parseInt(match[0], 10) : 999;
}
function sortNeighborsByPort(neighbors) {
  return [...neighbors].sort((a, b) => {
    if (a.wireless && !b.wireless) return 1;
    if (!a.wireless && b.wireless) return -1;
    return (a.portNumber ?? 999) - (b.portNumber ?? 999);
  });
}
function renderNeighborItem(n, helpers) {
  const badges = [];
  if (n.label) badges.push(`<span class="badge badge--port">${helpers.escapeHtml(n.label)}</span>`);
  if (n.poe)
    badges.push(`<span class="badge badge--poe">${helpers.localize("panel.badge.poe")}</span>`);
  if (n.wireless)
    badges.push(
      `<span class="badge badge--wireless">${helpers.localize("panel.badge.wifi")}</span>`
    );
  const safeName = helpers.escapeHtml(n.name);
  return `
    <div class="neighbor-item neighbor-item--compact">
      <a href="#" class="neighbor-item__name neighbor-item__name--link" data-navigate-device="${safeName}">${safeName}</a>
      <span class="neighbor-item__badges">${badges.join("")}</span>
    </div>
  `;
}
function renderVlanSection(context, name, helpers) {
  const vlanInfo = getNodeVlanInfo(name, context.payload);
  if (!vlanInfo) {
    return "";
  }
  return `
    <div class="panel-section">
      <div class="panel-section__title">${helpers.localize("panel.network")}</div>
      <div class="stats-list">
        <div class="stats-row">
          <span class="stats-row__label">${helpers.localize("panel.vlan")}</span>
          <span class="stats-row__value">${helpers.escapeHtml(vlanInfo.name)}</span>
        </div>
        <div class="stats-row">
          <span class="stats-row__label">${helpers.localize("panel.vlan_id")}</span>
          <span class="stats-row__value">${vlanInfo.id}</span>
        </div>
      </div>
    </div>
  `;
}
function renderRelatedEntitiesSection2(context, name, helpers) {
  const relatedEntities = context.payload?.related_entities?.[name] ?? [];
  if (relatedEntities.length === 0) {
    return "";
  }
  const entityItems = relatedEntities.map((entity) => {
    const icon = helpers.getDomainIcon(entity.domain);
    const displayName = entity.friendly_name ?? entity.entity_id;
    const stateClass = getEntityStateClass(entity.state);
    const stateLabel = normalizeStateLabel(entity.state, entity.domain, helpers.localize);
    const safeDisplayName = helpers.escapeHtml(displayName);
    const safeEntityId = helpers.escapeHtml(entity.entity_id);
    return `
        <div class="entity-item" data-entity-id="${safeEntityId}">
          <span class="entity-item__icon">${icon}</span>
          <div class="entity-item__info">
            <span class="entity-item__name" title="${safeDisplayName}">${safeDisplayName}</span>
            <span class="entity-item__id" title="${safeEntityId}">${safeEntityId}</span>
          </div>
          <span class="entity-item__state ${stateClass}" title="${helpers.escapeHtml(entity.state ?? "")}">${helpers.escapeHtml(stateLabel)}</span>
        </div>
      `;
  }).join("");
  return `
    <div class="panel-section">
      <div class="panel-section__title">${helpers.localize("panel.entities")}</div>
      <div class="entity-list">${entityItems}</div>
    </div>
  `;
}
var SIMPLE_STATES2 = ["on", "off", "home", "not_home", "unavailable", "unknown"];
var ISO_TIMESTAMP_PATTERN2 = /^\d{4}-\d{2}-\d{2}T/;
var MAC_ADDRESS_PATTERN2 = /^([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}$/;
var NUMERIC_PATTERN2 = /^-?\d+(\.\d+)?$/;
function normalizeStateLabel(state, domain, localize) {
  if (!state) return localize("panel.status.unknown");
  const trackerLabel = formatDeviceTrackerState(state, domain, localize);
  if (trackerLabel) return trackerLabel;
  if (SIMPLE_STATES2.includes(state.toLowerCase())) {
    return capitalizeFirst2(state);
  }
  const domainLabel = formatDomainState(state, domain);
  if (domainLabel) return domainLabel;
  return formatFallbackStateLabel(state);
}
function formatDeviceTrackerState(state, domain, localize) {
  if (domain !== "device_tracker") return null;
  const lower = state.toLowerCase();
  if (lower === "home" || lower === "connected") return localize("panel.status.online");
  if (lower === "not_home" || lower === "disconnected") return localize("panel.status.offline");
  return null;
}
function formatDomainState(state, domain) {
  if (domain === "sensor" || domain === "binary_sensor") {
    return formatSensorStateForPanel(state);
  }
  if (domain === "button") {
    return "\u2014";
  }
  if (domain === "update") {
    if (state === "off") return "Up to date";
    if (state === "on") return "Update";
  }
  return null;
}
function formatFallbackStateLabel(state) {
  if (state.length > 12) {
    return state.substring(0, 10) + "\u2026";
  }
  return capitalizeFirst2(state);
}
function formatSensorStateForPanel(state) {
  if (ISO_TIMESTAMP_PATTERN2.test(state)) {
    return formatRelativeTime(state);
  }
  if (MAC_ADDRESS_PATTERN2.test(state)) {
    return state.substring(0, 8) + "\u2026";
  }
  if (NUMERIC_PATTERN2.test(state)) {
    const num = parseFloat(state);
    if (Math.abs(num) >= 1e6) {
      return formatLargeNumber2(num);
    }
  }
  return null;
}
function capitalizeFirst2(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
function formatRelativeTime(iso) {
  try {
    const date = new Date(iso);
    const now = /* @__PURE__ */ new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 6e4);
    const diffHours = Math.floor(diffMs / 36e5);
    const diffDays = Math.floor(diffMs / 864e5);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return "\u2014";
  }
}
function formatLargeNumber2(num) {
  if (Math.abs(num) >= 1e9) {
    return (num / 1e9).toFixed(1) + "B";
  }
  if (Math.abs(num) >= 1e6) {
    return (num / 1e6).toFixed(1) + "M";
  }
  if (Math.abs(num) >= 1e3) {
    return (num / 1e3).toFixed(1) + "K";
  }
  return num.toString();
}
function getEntityStateClass(state) {
  if (!state) return "entity-item__state--unknown";
  const onStates = ["on", "home", "connected", "online", "true"];
  const offStates = ["off", "not_home", "disconnected", "offline", "false", "unavailable"];
  if (onStates.includes(state.toLowerCase())) return "entity-item__state--on";
  if (offStates.includes(state.toLowerCase())) return "entity-item__state--off";
  return "entity-item__state--neutral";
}
function extractPortInfo(label, isLeft) {
  if (!label) return null;
  const parts = label.split(" <-> ");
  if (parts.length === 2) {
    const side = isLeft ? parts[0] : parts[1];
    const portMatch2 = side.match(/Port\s*\d+/i);
    return portMatch2 ? portMatch2[0] : null;
  }
  if (label.match(/^Port\s*\d+$/i)) {
    return label;
  }
  const portMatch = label.match(/Port\s*\d+/i);
  return portMatch ? portMatch[0] : label;
}
function renderStatsTab(context, name, helpers) {
  const data = getStatsTabData(context, name);
  return `
    ${renderStatsLiveStatus(data.status, helpers)}
    ${renderStatsConnectionSection(data.nodeEdges, data.nodeType, data.apWirelessClients, helpers)}
    ${renderStatsNetworkInfo(data.vlanInfo, helpers)}
    ${renderStatsDeviceInfo(data.mac, data.ip, data.model, helpers)}
  `;
}
function renderStatsLiveStatus(status, helpers) {
  if (!status) {
    return "";
  }
  return `
    <div class="panel-section">
      <div class="panel-section__title">${helpers.localize("panel.status.live")}</div>
      <div class="stats-list">
        <div class="stats-row">
          <span class="stats-row__label">${helpers.localize("panel.status.status")}</span>
          <span class="stats-row__value">${helpers.getStatusBadgeHtml(status.state)}</span>
        </div>
        <div class="stats-row">
          <span class="stats-row__label">${helpers.localize("panel.status.last_changed")}</span>
          <span class="stats-row__value">${helpers.formatLastChanged(status.last_changed)}</span>
        </div>
      </div>
    </div>
  `;
}
function renderStatsConnectionSection(nodeEdges, nodeType, apWirelessClients, helpers) {
  const wiredCount = nodeEdges.filter((e) => !e.wireless).length;
  const poeCount = nodeEdges.filter((e) => e.poe).length;
  const poeRow = poeCount > 0 ? `<div class="stats-row"><span class="stats-row__label">${helpers.localize("panel.stats.connection_poe")}</span><span class="stats-row__value">${poeCount}</span></div>` : "";
  const isAp = nodeType === "ap" || nodeType === "access_point";
  const wirelessClientsRow = isAp && apWirelessClients !== void 0 ? `<div class="stats-row"><span class="stats-row__label">${helpers.localize("panel.stats.wireless_clients")}</span><span class="stats-row__value">${apWirelessClients}</span></div>` : "";
  return `
    <div class="panel-section">
      <div class="panel-section__title">${helpers.localize("panel.stats.connection")}</div>
      <div class="stats-list">
        <div class="stats-row">
          <span class="stats-row__label">${helpers.localize("panel.stats.total_connections")}</span>
          <span class="stats-row__value">${nodeEdges.length}</span>
        </div>
        <div class="stats-row">
          <span class="stats-row__label">${helpers.localize("panel.stats.wired")}</span>
          <span class="stats-row__value">${wiredCount}</span>
        </div>
        ${poeRow}
        ${wirelessClientsRow}
      </div>
    </div>
  `;
}
function renderStatsNetworkInfo(vlanInfo, helpers) {
  if (!vlanInfo) {
    return "";
  }
  return `
    <div class="panel-section">
      <div class="panel-section__title">${helpers.localize("panel.network_info")}</div>
      <div class="stats-list">
        <div class="stats-row">
          <span class="stats-row__label">${helpers.localize("panel.network")}</span>
          <span class="stats-row__value">${helpers.escapeHtml(vlanInfo.name)}</span>
        </div>
        <div class="stats-row">
          <span class="stats-row__label">${helpers.localize("panel.vlan_id")}</span>
          <span class="stats-row__value">${vlanInfo.id}</span>
        </div>
      </div>
    </div>
  `;
}
function renderStatsDeviceInfo(mac, ip, model, helpers) {
  if (!mac && !ip && !model) {
    return "";
  }
  const modelRow = model ? `
      <div class="info-row">
        <span class="info-row__label">${helpers.localize("panel.stats.model")}</span>
        <span class="info-row__value">${helpers.escapeHtml(model)}</span>
      </div>
    ` : "";
  const macRow = mac ? `
      <div class="info-row">
        <span class="info-row__label">${helpers.localize("panel.stats.mac")}</span>
        <code class="info-row__value">${helpers.escapeHtml(mac)}</code>
      </div>
    ` : "";
  const ipRow = ip ? `
      <div class="info-row">
        <span class="info-row__label">${helpers.localize("panel.stats.ip")}</span>
        <code class="info-row__value">${helpers.escapeHtml(ip)}</code>
      </div>
    ` : "";
  return `
    <div class="panel-section">
      <div class="panel-section__title">${helpers.localize("panel.device_info")}</div>
      ${modelRow}
      ${macRow}
      ${ipRow}
    </div>
  `;
}
function renderActionsTab(context, name, helpers) {
  const data = getActionsTabData(context, name, helpers);
  const actionItems = buildActionItems(data, helpers);
  return `
    <div class="panel-section">
      <div class="panel-section__title">${helpers.localize("panel.actions.title")}</div>
      <div class="actions-list">
        ${actionItems.join("")}
      </div>
    </div>
    ${renderEntityIdSection(data, helpers)}
  `;
}
function getStatsTabData(context, name) {
  const edges = context.payload?.edges ?? [];
  return {
    nodeEdges: edges.filter((edge) => edge.left === name || edge.right === name),
    mac: getNodeMac2(context.payload, name),
    ip: getNodeIp(context.payload, name),
    model: getNodeModel2(context.payload, name),
    status: context.payload?.node_status?.[name],
    vlanInfo: getNodeVlanInfo(name, context.payload),
    nodeType: getNodeType2(context.payload, name),
    apWirelessClients: context.payload?.ap_client_counts?.[name]
  };
}
function getActionsTabData(context, name, helpers) {
  const entityId = getNodeEntityId(context.payload, name);
  const mac = getNodeMac2(context.payload, name);
  const ip = getNodeIp(context.payload, name);
  const nodeType = getNodeType2(context.payload, name);
  return {
    entityId,
    hasPortInfo: nodeType === "switch" || nodeType === "gateway",
    safeEntityId: entityId ? helpers.escapeHtml(entityId) : "",
    safeMac: mac ? helpers.escapeHtml(mac) : "",
    safeIp: ip ? helpers.escapeHtml(ip) : "",
    safeName: helpers.escapeHtml(name)
  };
}
function buildActionItems(data, helpers) {
  const items = [];
  pushIf2(items, renderEntityAction(data, helpers));
  pushIf2(items, renderPortsAction(data, helpers));
  pushIf2(items, renderCopyAction("copy_mac", data.safeMac, helpers));
  pushIf2(items, renderCopyAction("copy_ip", data.safeIp, helpers));
  return items;
}
function renderEntityAction(data, helpers) {
  if (!data.entityId) {
    return `<div class="panel-empty__text">${helpers.localize("panel.actions.no_entity")}</div>`;
  }
  return `
    <button type="button" class="action-button" data-entity-id="${data.safeEntityId}">
      <span class="action-button__icon">${helpers.getIcon("action-details")}</span>
      <span class="action-button__text">${helpers.localize("panel.actions.view_entity")}</span>
    </button>
  `;
}
function renderPortsAction(data, helpers) {
  if (!data.hasPortInfo) {
    return null;
  }
  return `
    <button type="button" class="action-button" data-action="view-ports" data-node-name="${data.safeName}">
      <span class="action-button__icon">${helpers.getIcon("action-ports")}</span>
      <span class="action-button__text">${helpers.localize("panel.actions.view_ports")}</span>
    </button>
  `;
}
function renderCopyAction(labelKey, value, helpers) {
  if (!value) {
    return null;
  }
  return `
    <button type="button" class="action-button" data-action="copy" data-copy-value="${value}">
      <span class="action-button__icon">${helpers.getIcon("action-copy")}</span>
      <span class="action-button__text">${helpers.localize(`panel.actions.${labelKey}`)}</span>
    </button>
  `;
}
function renderEntityIdSection(data, helpers) {
  if (!data.entityId) {
    return "";
  }
  return `
    <div class="panel-section">
      <div class="panel-section__title">${helpers.localize("panel.actions.entity")}</div>
      <code class="entity-id">${data.safeEntityId}</code>
    </div>
  `;
}
function pushIf2(items, value) {
  if (value) {
    items.push(value);
  }
}
function getNodeType2(payload, name) {
  return payload?.node_types?.[name] ?? "unknown";
}
function getNodeMac2(payload, name) {
  return payload?.client_macs?.[name] ?? payload?.device_macs?.[name] ?? null;
}
function getNodeIp(payload, name) {
  return getNodeIpFromPayload(payload, name);
}
function getNodeModel2(payload, name) {
  const details = payload?.device_details?.[name];
  if (!details) return null;
  return details.model_name ?? details.model ?? null;
}
function getNodeEntityId(payload, name) {
  return payload?.node_entities?.[name] ?? payload?.client_entities?.[name] ?? payload?.device_entities?.[name] ?? null;
}
function renderOverviewStatsGrid(nodeCount, _edgeCount, helpers) {
  return `
    <div class="panel-stats-compact">
      <span class="panel-stats-compact__value">${nodeCount}</span>
      <span class="panel-stats-compact__label">${helpers.localize("panel.overview.total_nodes")}</span>
    </div>
  `;
}
function renderOverviewStatusSection(counts, helpers) {
  if (!counts.hasStatus) {
    return "";
  }
  return `
    <div class="panel-section">
      <div class="panel-section__title">${helpers.localize("panel.status.live")}</div>
      <div class="device-list">
        <div class="device-row"><span class="status-dot status-dot--online"></span><span class="device-row__label">${helpers.localize("panel.status.online")}</span><span class="device-row__count">${counts.online}</span></div>
        <div class="device-row"><span class="status-dot status-dot--offline"></span><span class="device-row__label">${helpers.localize("panel.status.offline")}</span><span class="device-row__count">${counts.offline}</span></div>
      </div>
    </div>
  `;
}
function renderOverviewDeviceBreakdown(counts, helpers) {
  const items = [
    {
      key: "gateways",
      icon: helpers.getIcon("node-gateway"),
      label: helpers.localize("panel.device_type.gateways")
    },
    {
      key: "switches",
      icon: helpers.getIcon("node-switch"),
      label: helpers.localize("panel.device_type.switches")
    },
    {
      key: "aps",
      icon: helpers.getIcon("node-ap"),
      label: helpers.localize("panel.device_type.access_points")
    },
    {
      key: "clients",
      icon: helpers.getIcon("node-client"),
      label: helpers.localize("panel.device_type.clients")
    },
    {
      key: "other",
      icon: helpers.getIcon("node-other"),
      label: helpers.localize("panel.device_type.other")
    }
  ];
  const rows = items.filter((item) => counts[item.key] > 0).map(
    (item) => `<div class="device-row"><span class="device-row__icon">${item.icon}</span><span class="device-row__label">${item.label}</span><span class="device-row__count">${counts[item.key]}</span></div>`
  ).join("");
  return `
    <div class="panel-section">
      <div class="panel-section__title">${helpers.localize("panel.device_breakdown")}</div>
      <div class="device-list">${rows}</div>
    </div>
  `;
}
function isClientType(type) {
  return CLIENT_SUBTYPES.includes(type);
}
function countDevicesByType(nodes, nodeTypes) {
  return {
    gateways: nodes.filter((n) => nodeTypes[n] === "gateway").length,
    switches: nodes.filter((n) => nodeTypes[n] === "switch").length,
    aps: nodes.filter((n) => nodeTypes[n] === "ap").length,
    clients: nodes.filter((n) => isClientType(nodeTypes[n])).length,
    other: nodes.filter(
      (n) => !["gateway", "switch", "ap"].includes(nodeTypes[n]) && !isClientType(nodeTypes[n])
    ).length
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
function getNodeVlanInfo(name, payload) {
  if (!payload?.node_vlans || !payload?.vlan_info) {
    return null;
  }
  const vlanId = payload.node_vlans[name];
  if (vlanId === null || vlanId === void 0) {
    return null;
  }
  return payload.vlan_info[vlanId] ?? null;
}

// src/card/ui/context-menu.ts
function renderContextMenu(options) {
  const data = buildContextMenuData(options);
  const items = buildContextMenuItems(data, options);
  const subtitle = data.model ? escapeHtml(data.model) : escapeHtml(data.nodeType);
  return `
    <div class="context-menu" data-theme="${escapeHtml(options.theme)}" data-context-node="${data.safeName}">
      <div class="context-menu__header">
        <div class="context-menu__title">${data.typeIcon} ${data.safeName}</div>
        <div class="context-menu__type">${subtitle}</div>
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
  const ip = actionButton.getAttribute("data-ip");
  return {
    action: isContextMenuAction(action) ? action : "unknown",
    mac,
    ip
  };
}
function isContextMenuAction(action) {
  return action === "details" || action === "copy-mac" || action === "copy-ip" || action === "restart" || action === "view-ports";
}
function buildContextMenuData(options) {
  const nodeType = getNodeType3(options.payload, options.nodeName);
  const mac = getNodeMac3(options.payload, options.nodeName);
  const entityId = getNodeEntityId2(options.payload, options.nodeName);
  const ip = getNodeIp2(options.payload, options.nodeName);
  const model = getNodeModel3(options.payload, options.nodeName);
  return {
    safeName: escapeHtml(options.nodeName),
    nodeType,
    typeIcon: options.getNodeTypeIcon(nodeType),
    mac,
    ip,
    model,
    entityId,
    isDevice: nodeType !== "client",
    hasPortInfo: nodeType === "switch" || nodeType === "gateway"
  };
}
function buildContextMenuItems(data, options) {
  const items = [];
  pushIf3(items, renderDetailsItem(data, options));
  pushIf3(items, renderCopyMacItem(data, options));
  pushIf3(items, renderCopyIpItem(data, options));
  pushIf3(items, renderPortsItem(data, options));
  if (items.length > 0) {
    items.push('<div class="context-menu__divider"></div>');
  }
  pushIf3(items, renderRestartItem(data, options));
  return items;
}
function renderDetailsItem(data, options) {
  if (!data.entityId) {
    return null;
  }
  return `
    <button type="button" class="context-menu__item" data-context-action="details">
      <span class="context-menu__icon">${options.getIcon("menu-details")}</span>
      <span>${options.localize("context_menu.view_details")}</span>
    </button>
  `;
}
function renderCopyMacItem(data, options) {
  if (!data.mac) {
    return null;
  }
  return `
    <button type="button" class="context-menu__item" data-context-action="copy-mac" data-mac="${escapeHtml(data.mac)}">
      <span class="context-menu__icon">${options.getIcon("menu-copy")}</span>
      <span>${options.localize("context_menu.copy_mac")}</span>
    </button>
  `;
}
function renderCopyIpItem(data, options) {
  if (!data.ip) {
    return null;
  }
  return `
    <button type="button" class="context-menu__item" data-context-action="copy-ip" data-ip="${escapeHtml(data.ip)}">
      <span class="context-menu__icon">${options.getIcon("menu-copy-ip")}</span>
      <span>${options.localize("context_menu.copy_ip")}</span>
    </button>
  `;
}
function renderPortsItem(data, options) {
  if (!data.hasPortInfo) {
    return null;
  }
  return `
    <button type="button" class="context-menu__item" data-context-action="view-ports">
      <span class="context-menu__icon">${options.getIcon("menu-ports")}</span>
      <span>${options.localize("context_menu.view_ports")}</span>
    </button>
  `;
}
function renderRestartItem(data, options) {
  if (!data.isDevice) {
    return null;
  }
  return `
    <button type="button" class="context-menu__item" data-context-action="restart" ${!data.entityId ? "disabled" : ""}>
      <span class="context-menu__icon">${options.getIcon("menu-restart")}</span>
      <span>${options.localize("context_menu.restart")}</span>
    </button>
  `;
}
function pushIf3(items, value) {
  if (value) {
    items.push(value);
  }
}
function getNodeType3(payload, nodeName) {
  return payload?.node_types?.[nodeName] ?? "unknown";
}
function getNodeMac3(payload, nodeName) {
  return payload?.client_macs?.[nodeName] ?? payload?.device_macs?.[nodeName] ?? null;
}
function getNodeEntityId2(payload, nodeName) {
  return payload?.node_entities?.[nodeName] ?? payload?.client_entities?.[nodeName] ?? payload?.device_entities?.[nodeName] ?? null;
}
function getNodeIp2(payload, nodeName) {
  return getNodeIpFromPayload(payload, nodeName);
}
function getNodeModel3(payload, nodeName) {
  const details = payload?.device_details?.[nodeName];
  if (!details) return null;
  return details.model_name ?? details.model ?? null;
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
  return fetchWithAuth2(url, signal, async (response) => {
    const svg3 = await response.text();
    const background = response.headers.get("X-Theme-Background");
    return { svg: svg3, background };
  });
}
async function loadPayload(fetchWithAuth2, url, signal) {
  return fetchWithAuth2(url, signal, (response) => response.json());
}

// src/card/data/websocket.ts
async function subscribeMapUpdates(hass, entryId, onUpdate) {
  if (!hass.connection?.subscribeMessage) {
    return { subscribed: false, reason: "WebSocket not available" };
  }
  try {
    const unsubscribe = await hass.connection.subscribeMessage(
      (msg) => onUpdate(msg.payload),
      { type: "unifi_network_map/subscribe", entry_id: entryId },
      { resubscribe: true }
    );
    return { subscribed: true, unsubscribe };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Subscription failed";
    return { subscribed: false, reason };
  }
}

// src/card/core/state.ts
function normalizeConfig(config) {
  if (config.entry_id) {
    const theme = config.theme ?? "unifi";
    const svgTheme = config.svg_theme ?? "unifi";
    const iconSet = config.icon_set ?? "modern";
    const queryParams = `?theme=${theme}&svg_theme=${svgTheme}&icon_set=${iconSet}`;
    return {
      entry_id: config.entry_id,
      theme,
      svg_theme: svgTheme,
      icon_set: iconSet,
      svg_url: `/api/${DOMAIN}/${config.entry_id}/svg${queryParams}`,
      data_url: `/api/${DOMAIN}/${config.entry_id}/payload`,
      card_height: config.card_height
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

// src/card/shared/locales/de.ts
var de = {
  "card.controls.reset": "Zur\xFCcksetzen",
  "card.controls.reset_view": "Ansicht zur\xFCcksetzen",
  "card.controls.zoom_in": "Vergr\xF6\xDFern",
  "card.controls.zoom_out": "Verkleinern",
  "card.error.load_payload": "Daten konnten nicht geladen werden ({error})",
  "card.error.load_svg": "SVG konnte nicht geladen werden ({error})",
  "card.error.missing_auth": "Authentifizierungstoken fehlt",
  "card.error.missing_config": "Konfiguration fehlt",
  "card.error.missing_entry": "W\xE4hle in den Karteneinstellungen eine UniFi Network Map-Instanz aus.",
  "card.error.retry": "Erneut versuchen",
  "card.error.unknown": "Unbekannter Fehler",
  "card.filter.hide": "{label} ausblenden",
  "card.filter.show": "{label} anzeigen",
  "card.loading.aria": "Laden",
  "card.loading.map": "Karte wird geladen...",
  "card.loading.refresh": "Daten werden aktualisiert...",
  "card.preview.alt": "UniFi Network Map Vorschau",
  "card.time.days_ago": "vor {count}d",
  "card.time.hours_ago": "vor {count}h",
  "card.time.just_now": "Gerade eben",
  "card.time.minutes_ago": "vor {count}m",
  "card.time.unknown": "Unbekannt",
  "context_menu.copy_ip": "IP-Adresse kopieren",
  "context_menu.copy_mac": "MAC-Adresse kopieren",
  "context_menu.restart": "Ger\xE4t neu starten",
  "context_menu.view_details": "Details anzeigen",
  "context_menu.view_ports": "Ports anzeigen",
  "editor.card_height": "Kartenh\xF6he (optional)",
  "editor.entry_id": "UniFi Network Map-Instanz",
  "editor.no_entries": "Keine UniFi Network Map-Integrationen gefunden. Bitte zuerst eine hinzuf\xFCgen.",
  "editor.theme": "Thema",
  "editor.theme.dark": "Dunkel",
  "editor.theme.light": "Hell",
  "editor.theme.unifi": "UniFi (Standard)",
  "editor.theme.unifi_dark": "UniFi Dunkel",
  "editor.svg_theme": "Kartenfarben",
  "editor.svg_theme.unifi": "UniFi (Standard)",
  "editor.svg_theme.unifi_dark": "UniFi Dunkel",
  "editor.svg_theme.minimal": "Minimal",
  "editor.svg_theme.minimal_dark": "Minimal Dunkel",
  "editor.svg_theme.classic": "Klassisch",
  "editor.svg_theme.classic_dark": "Klassisch Dunkel",
  "editor.icon_set": "Symbol-Stil",
  "editor.icon_set.modern": "Modern (Standard)",
  "editor.icon_set.isometric": "Isometrisch",
  "edge_tooltip.band_24": "2.4GHz",
  "edge_tooltip.band_5": "5GHz",
  "edge_tooltip.band_6": "6GHz",
  "edge_tooltip.channel": "Kanal {channel}{suffix}",
  "edge_tooltip.poe": "Per PoE versorgt",
  "edge_tooltip.speed_gbps": "{speed} Gbps",
  "edge_tooltip.speed_mbps": "{speed} Mbps",
  "edge_tooltip.wired": "Kabelgebunden",
  "edge_tooltip.wireless": "Drahtlos",
  "entity_modal.device_info": "Ger\xE4teinformationen",
  "entity_modal.device_type": "Ger\xE4tetyp",
  "entity_modal.ip": "IP-Adresse",
  "entity_modal.last_changed": "Zuletzt ge\xE4ndert",
  "entity_modal.mac": "MAC-Adresse",
  "entity_modal.model": "Modell",
  "entity_modal.no_entities": "Keine Home-Assistant-Entit\xE4ten f\xFCr dieses Ger\xE4t gefunden",
  "entity_modal.related_entities": "Zugeh\xF6rige Entit\xE4ten",
  "entity_modal.related_entities_count": "Zugeh\xF6rige Entit\xE4ten ({count})",
  "entity_modal.status": "Status",
  "entity_modal.status_offline": "Offline",
  "entity_modal.status_online": "Online",
  "entity_modal.status_unknown": "Unbekannt",
  "panel.actions.copy_ip": "IP-Adresse kopieren",
  "panel.actions.copy_mac": "MAC-Adresse kopieren",
  "panel.actions.entity": "Entit\xE4t",
  "panel.actions.no_entity": "Keine Home-Assistant-Entit\xE4t verkn\xFCpft",
  "panel.actions.title": "Schnellaktionen",
  "panel.actions.view_entity": "Entit\xE4tsdetails anzeigen",
  "panel.actions.view_ports": "Port\xFCbersicht anzeigen",
  "panel.badge.poe": "PoE",
  "panel.badge.wifi": "WiFi",
  "panel.connected_devices": "Verbundene Ger\xE4te",
  "panel.device_breakdown": "Ger\xE4te\xFCbersicht",
  "panel.device_info": "Ger\xE4teinfo",
  "panel.device_type.access_points": "Access Points",
  "panel.device_type.clients": "Clients",
  "panel.device_type.gateways": "Gateways",
  "panel.device_type.other": "Andere",
  "panel.device_type.switches": "Switches",
  "panel.entities": "Home-Assistant-Entit\xE4ten",
  "panel.hint": "Klicke auf einen Knoten in der Karte, um Details zu sehen",
  "panel.loading": "Netzwerkdaten werden geladen...",
  "panel.network": "Netzwerk",
  "panel.network_info": "Netzwerkinfo",
  "panel.no_connections": "Keine Verbindungen",
  "panel.no_data": "Keine Daten verf\xFCgbar",
  "panel.overview": "Netzwerk\xFCbersicht",
  "panel.overview.connections": "Verbindungen",
  "panel.overview.total_nodes": "Gesamte Knoten",
  "panel.stats.connection": "Verbindungsstatistiken",
  "panel.stats.connection_poe": "Per PoE versorgt",
  "panel.stats.ip": "IP-Adresse",
  "panel.stats.mac": "MAC-Adresse",
  "panel.stats.model": "Modell",
  "panel.stats.total_connections": "Gesamtverbindungen",
  "panel.stats.wired": "Kabelgebunden",
  "panel.stats.wireless": "Drahtlos",
  "panel.stats.wireless_clients": "WLAN-Clients",
  "panel.status.last_changed": "Zuletzt ge\xE4ndert",
  "panel.status.live": "Live-Status",
  "panel.status.offline": "Offline",
  "panel.status.online": "Online",
  "panel.status.status": "Status",
  "panel.status.unknown": "Unbekannt",
  "panel.tabs.actions": "Aktionen",
  "panel.tabs.overview": "\xDCbersicht",
  "panel.tabs.stats": "Statistiken",
  "panel.vlan": "VLAN",
  "panel.vlan_id": "VLAN-ID",
  "port_modal.empty": "Leer",
  "port_modal.no_ports": "Keine Portinformationen verf\xFCgbar",
  "port_modal.port": "Port {port}",
  "port_modal.title": "Port\xFCbersicht",
  "toast.copied": "Kopiert!",
  "toast.copy_ip": "IP-Adresse kopiert!",
  "toast.copy_mac": "MAC-Adresse kopiert!",
  "toast.no_entity": "Keine Entit\xE4t f\xFCr dieses Ger\xE4t gefunden",
  "toast.restart_sent": "Neustartbefehl gesendet"
};

// src/card/shared/locales/en.ts
var en = {
  "card.controls.reset": "Reset",
  "card.controls.reset_view": "Reset view",
  "card.controls.zoom_in": "Zoom in",
  "card.controls.zoom_out": "Zoom out",
  "card.error.load_payload": "Failed to load payload ({error})",
  "card.error.load_svg": "Failed to load SVG ({error})",
  "card.error.missing_auth": "Missing auth token",
  "card.error.missing_config": "Missing configuration",
  "card.error.missing_entry": "Select a UniFi Network Map instance in the card settings.",
  "card.error.retry": "Retry",
  "card.error.unknown": "Unknown error",
  "card.filter.hide": "Hide {label}",
  "card.filter.show": "Show {label}",
  "card.loading.aria": "Loading",
  "card.loading.map": "Loading map...",
  "card.loading.refresh": "Refreshing data...",
  "card.preview.alt": "UniFi Network Map preview",
  "card.time.days_ago": "{count}d ago",
  "card.time.hours_ago": "{count}h ago",
  "card.time.just_now": "Just now",
  "card.time.minutes_ago": "{count}m ago",
  "card.time.unknown": "Unknown",
  "context_menu.copy_ip": "Copy IP Address",
  "context_menu.copy_mac": "Copy MAC Address",
  "context_menu.restart": "Restart Device",
  "context_menu.view_details": "View Details",
  "context_menu.view_ports": "View Ports",
  "editor.card_height": "Card height (optional)",
  "editor.entry_id": "UniFi Network Map Instance",
  "editor.no_entries": "No UniFi Network Map integrations found. Please add one first.",
  "editor.theme": "Theme",
  "editor.theme.dark": "Dark",
  "editor.theme.light": "Light",
  "editor.theme.unifi": "UniFi (default)",
  "editor.theme.unifi_dark": "UniFi Dark",
  "editor.svg_theme": "Map Colors",
  "editor.svg_theme.unifi": "UniFi (default)",
  "editor.svg_theme.unifi_dark": "UniFi Dark",
  "editor.svg_theme.minimal": "Minimal",
  "editor.svg_theme.minimal_dark": "Minimal Dark",
  "editor.svg_theme.classic": "Classic",
  "editor.svg_theme.classic_dark": "Classic Dark",
  "editor.icon_set": "Icon Style",
  "editor.icon_set.modern": "Modern (default)",
  "editor.icon_set.isometric": "Isometric",
  "edge_tooltip.band_24": "2.4GHz",
  "edge_tooltip.band_5": "5GHz",
  "edge_tooltip.band_6": "6GHz",
  "edge_tooltip.channel": "Channel {channel}{suffix}",
  "edge_tooltip.poe": "PoE Powered",
  "edge_tooltip.speed_gbps": "{speed} Gbps",
  "edge_tooltip.speed_mbps": "{speed} Mbps",
  "edge_tooltip.wired": "Wired",
  "edge_tooltip.wireless": "Wireless",
  "entity_modal.device_info": "Device Information",
  "entity_modal.device_type": "Device Type",
  "entity_modal.ip": "IP Address",
  "entity_modal.last_changed": "Last Changed",
  "entity_modal.mac": "MAC Address",
  "entity_modal.model": "Model",
  "entity_modal.no_entities": "No Home Assistant entities found for this device",
  "entity_modal.related_entities": "Related Entities",
  "entity_modal.related_entities_count": "Related Entities ({count})",
  "entity_modal.status": "Status",
  "entity_modal.status_offline": "Offline",
  "entity_modal.status_online": "Online",
  "entity_modal.status_unknown": "Unknown",
  "panel.actions.copy_ip": "Copy IP Address",
  "panel.actions.copy_mac": "Copy MAC Address",
  "panel.actions.entity": "Entity",
  "panel.actions.no_entity": "No Home Assistant entity linked",
  "panel.actions.title": "Quick Actions",
  "panel.actions.view_entity": "View Entity Details",
  "panel.actions.view_ports": "View Port Overview",
  "panel.badge.poe": "PoE",
  "panel.badge.wifi": "WiFi",
  "panel.connected_devices": "Connected Devices",
  "panel.device_breakdown": "Device Breakdown",
  "panel.device_info": "Device Info",
  "panel.device_type.access_points": "Access Points",
  "panel.device_type.clients": "Clients",
  "panel.device_type.gateways": "Gateways",
  "panel.device_type.other": "Other",
  "panel.device_type.switches": "Switches",
  "panel.entities": "Home Assistant Entities",
  "panel.hint": "Click a node in the map to see details",
  "panel.loading": "Loading network data...",
  "panel.network": "Network",
  "panel.network_info": "Network Info",
  "panel.no_connections": "No connections",
  "panel.no_data": "No data available",
  "panel.overview": "Network Overview",
  "panel.overview.connections": "Connections",
  "panel.overview.total_nodes": "Total Nodes",
  "panel.stats.connection": "Connection Stats",
  "panel.stats.connection_poe": "PoE Powered",
  "panel.stats.ip": "IP Address",
  "panel.stats.mac": "MAC Address",
  "panel.stats.model": "Model",
  "panel.stats.total_connections": "Total Connections",
  "panel.stats.wired": "Wired",
  "panel.stats.wireless": "Wireless",
  "panel.stats.wireless_clients": "Wireless Clients",
  "panel.status.last_changed": "Last Changed",
  "panel.status.live": "Live Status",
  "panel.status.offline": "Offline",
  "panel.status.online": "Online",
  "panel.status.status": "Status",
  "panel.status.unknown": "Unknown",
  "panel.tabs.actions": "Actions",
  "panel.tabs.overview": "Overview",
  "panel.tabs.stats": "Stats",
  "panel.vlan": "VLAN",
  "panel.vlan_id": "VLAN ID",
  "port_modal.empty": "Empty",
  "port_modal.no_ports": "No port information available",
  "port_modal.port": "Port {port}",
  "port_modal.title": "Port Overview",
  "toast.copied": "Copied!",
  "toast.copy_ip": "IP address copied!",
  "toast.copy_mac": "MAC address copied!",
  "toast.no_entity": "No entity found for this device",
  "toast.restart_sent": "Restart command sent"
};

// src/card/shared/locales/es.ts
var es = {
  "card.controls.reset": "Restablecer",
  "card.controls.reset_view": "Restablecer vista",
  "card.controls.zoom_in": "Acercar",
  "card.controls.zoom_out": "Alejar",
  "card.error.load_payload": "Error al cargar datos ({error})",
  "card.error.load_svg": "Error al cargar SVG ({error})",
  "card.error.missing_auth": "Falta el token de autenticaci\xF3n",
  "card.error.missing_config": "Falta configuraci\xF3n",
  "card.error.missing_entry": "Selecciona una instancia de UniFi Network Map en la configuraci\xF3n de la tarjeta.",
  "card.error.retry": "Reintentar",
  "card.error.unknown": "Error desconocido",
  "card.filter.hide": "Ocultar {label}",
  "card.filter.show": "Mostrar {label}",
  "card.loading.aria": "Cargando",
  "card.loading.map": "Cargando mapa...",
  "card.loading.refresh": "Actualizando datos...",
  "card.preview.alt": "Vista previa de UniFi Network Map",
  "card.time.days_ago": "hace {count}d",
  "card.time.hours_ago": "hace {count}h",
  "card.time.just_now": "Justo ahora",
  "card.time.minutes_ago": "hace {count}m",
  "card.time.unknown": "Desconocido",
  "context_menu.copy_ip": "Copiar direcci\xF3n IP",
  "context_menu.copy_mac": "Copiar direcci\xF3n MAC",
  "context_menu.restart": "Reiniciar dispositivo",
  "context_menu.view_details": "Ver detalles",
  "context_menu.view_ports": "Ver puertos",
  "editor.card_height": "Altura de la tarjeta (opcional)",
  "editor.entry_id": "Instancia de UniFi Network Map",
  "editor.no_entries": "No se encontraron integraciones de UniFi Network Map. A\xF1ade una primero.",
  "editor.theme": "Tema",
  "editor.theme.dark": "Oscuro",
  "editor.theme.light": "Claro",
  "editor.theme.unifi": "UniFi (predeterminado)",
  "editor.theme.unifi_dark": "UniFi oscuro",
  "editor.svg_theme": "Colores del mapa",
  "editor.svg_theme.unifi": "UniFi (predeterminado)",
  "editor.svg_theme.unifi_dark": "UniFi oscuro",
  "editor.svg_theme.minimal": "M\xEDnimo",
  "editor.svg_theme.minimal_dark": "M\xEDnimo oscuro",
  "editor.svg_theme.classic": "Cl\xE1sico",
  "editor.svg_theme.classic_dark": "Cl\xE1sico oscuro",
  "editor.icon_set": "Estilo de iconos",
  "editor.icon_set.modern": "Moderno (predeterminado)",
  "editor.icon_set.isometric": "Isom\xE9trico",
  "edge_tooltip.band_24": "2.4GHz",
  "edge_tooltip.band_5": "5GHz",
  "edge_tooltip.band_6": "6GHz",
  "edge_tooltip.channel": "Canal {channel}{suffix}",
  "edge_tooltip.poe": "Alimentado por PoE",
  "edge_tooltip.speed_gbps": "{speed} Gbps",
  "edge_tooltip.speed_mbps": "{speed} Mbps",
  "edge_tooltip.wired": "Cableado",
  "edge_tooltip.wireless": "Inal\xE1mbrico",
  "entity_modal.device_info": "Informaci\xF3n del dispositivo",
  "entity_modal.device_type": "Tipo de dispositivo",
  "entity_modal.ip": "Direcci\xF3n IP",
  "entity_modal.last_changed": "\xDAltimo cambio",
  "entity_modal.mac": "Direcci\xF3n MAC",
  "entity_modal.model": "Modelo",
  "entity_modal.no_entities": "No se encontraron entidades de Home Assistant para este dispositivo",
  "entity_modal.related_entities": "Entidades relacionadas",
  "entity_modal.related_entities_count": "Entidades relacionadas ({count})",
  "entity_modal.status": "Estado",
  "entity_modal.status_offline": "Desconectado",
  "entity_modal.status_online": "En l\xEDnea",
  "entity_modal.status_unknown": "Desconocido",
  "panel.actions.copy_ip": "Copiar direcci\xF3n IP",
  "panel.actions.copy_mac": "Copiar direcci\xF3n MAC",
  "panel.actions.entity": "Entidad",
  "panel.actions.no_entity": "No hay entidad de Home Assistant vinculada",
  "panel.actions.title": "Acciones r\xE1pidas",
  "panel.actions.view_entity": "Ver detalles de la entidad",
  "panel.actions.view_ports": "Ver resumen de puertos",
  "panel.badge.poe": "PoE",
  "panel.badge.wifi": "WiFi",
  "panel.connected_devices": "Dispositivos conectados",
  "panel.device_breakdown": "Desglose de dispositivos",
  "panel.device_info": "Informaci\xF3n del dispositivo",
  "panel.device_type.access_points": "Puntos de acceso",
  "panel.device_type.clients": "Clientes",
  "panel.device_type.gateways": "Puertas de enlace",
  "panel.device_type.other": "Otros",
  "panel.device_type.switches": "Switches",
  "panel.entities": "Entidades de Home Assistant",
  "panel.hint": "Haz clic en un nodo del mapa para ver detalles",
  "panel.loading": "Cargando datos de red...",
  "panel.network": "Red",
  "panel.network_info": "Informaci\xF3n de red",
  "panel.no_connections": "Sin conexiones",
  "panel.no_data": "No hay datos disponibles",
  "panel.overview": "Resumen de red",
  "panel.overview.connections": "Conexiones",
  "panel.overview.total_nodes": "Nodos totales",
  "panel.stats.connection": "Estad\xEDsticas de conexi\xF3n",
  "panel.stats.connection_poe": "Alimentado por PoE",
  "panel.stats.ip": "Direcci\xF3n IP",
  "panel.stats.mac": "Direcci\xF3n MAC",
  "panel.stats.model": "Modelo",
  "panel.stats.total_connections": "Conexiones totales",
  "panel.stats.wired": "Cableado",
  "panel.stats.wireless": "Inal\xE1mbrico",
  "panel.stats.wireless_clients": "Clientes inal\xE1mbricos",
  "panel.status.last_changed": "\xDAltimo cambio",
  "panel.status.live": "Estado en tiempo real",
  "panel.status.offline": "Desconectado",
  "panel.status.online": "En l\xEDnea",
  "panel.status.status": "Estado",
  "panel.status.unknown": "Desconocido",
  "panel.tabs.actions": "Acciones",
  "panel.tabs.overview": "Resumen",
  "panel.tabs.stats": "Estad\xEDsticas",
  "panel.vlan": "VLAN",
  "panel.vlan_id": "ID de VLAN",
  "port_modal.empty": "Vac\xEDo",
  "port_modal.no_ports": "No hay informaci\xF3n de puertos disponible",
  "port_modal.port": "Puerto {port}",
  "port_modal.title": "Resumen de puertos",
  "toast.copied": "\xA1Copiado!",
  "toast.copy_ip": "\xA1Direcci\xF3n IP copiada!",
  "toast.copy_mac": "\xA1Direcci\xF3n MAC copiada!",
  "toast.no_entity": "No se encontr\xF3 una entidad para este dispositivo",
  "toast.restart_sent": "Comando de reinicio enviado"
};

// src/card/shared/locales/fr.ts
var fr = {
  "card.controls.reset": "R\xE9initialiser",
  "card.controls.reset_view": "R\xE9initialiser la vue",
  "card.controls.zoom_in": "Zoom avant",
  "card.controls.zoom_out": "Zoom arri\xE8re",
  "card.error.load_payload": "\xC9chec du chargement des donn\xE9es ({error})",
  "card.error.load_svg": "\xC9chec du chargement du SVG ({error})",
  "card.error.missing_auth": "Jeton d\u2019authentification manquant",
  "card.error.missing_config": "Configuration manquante",
  "card.error.missing_entry": "S\xE9lectionnez une instance UniFi Network Map dans les param\xE8tres de la carte.",
  "card.error.retry": "R\xE9essayer",
  "card.error.unknown": "Erreur inconnue",
  "card.filter.hide": "Masquer {label}",
  "card.filter.show": "Afficher {label}",
  "card.loading.aria": "Chargement",
  "card.loading.map": "Chargement de la carte...",
  "card.loading.refresh": "Actualisation des donn\xE9es...",
  "card.preview.alt": "Aper\xE7u de UniFi Network Map",
  "card.time.days_ago": "il y a {count}j",
  "card.time.hours_ago": "il y a {count}h",
  "card.time.just_now": "\xC0 l\u2019instant",
  "card.time.minutes_ago": "il y a {count}m",
  "card.time.unknown": "Inconnu",
  "context_menu.copy_ip": "Copier l\u2019adresse IP",
  "context_menu.copy_mac": "Copier l\u2019adresse MAC",
  "context_menu.restart": "Red\xE9marrer l\u2019appareil",
  "context_menu.view_details": "Voir les d\xE9tails",
  "context_menu.view_ports": "Voir les ports",
  "editor.card_height": "Hauteur de la carte (optionnel)",
  "editor.entry_id": "Instance UniFi Network Map",
  "editor.no_entries": "Aucune int\xE9gration UniFi Network Map trouv\xE9e. Ajoutez-en une d\u2019abord.",
  "editor.theme": "Th\xE8me",
  "editor.theme.dark": "Sombre",
  "editor.theme.light": "Clair",
  "editor.theme.unifi": "UniFi (par d\xE9faut)",
  "editor.theme.unifi_dark": "UniFi sombre",
  "editor.svg_theme": "Couleurs de la carte",
  "editor.svg_theme.unifi": "UniFi (par d\xE9faut)",
  "editor.svg_theme.unifi_dark": "UniFi sombre",
  "editor.svg_theme.minimal": "Minimal",
  "editor.svg_theme.minimal_dark": "Minimal sombre",
  "editor.svg_theme.classic": "Classique",
  "editor.svg_theme.classic_dark": "Classique sombre",
  "editor.icon_set": "Style d'ic\xF4nes",
  "editor.icon_set.modern": "Moderne (par d\xE9faut)",
  "editor.icon_set.isometric": "Isom\xE9trique",
  "edge_tooltip.band_24": "2.4GHz",
  "edge_tooltip.band_5": "5GHz",
  "edge_tooltip.band_6": "6GHz",
  "edge_tooltip.channel": "Canal {channel}{suffix}",
  "edge_tooltip.poe": "Aliment\xE9 par PoE",
  "edge_tooltip.speed_gbps": "{speed} Gbps",
  "edge_tooltip.speed_mbps": "{speed} Mbps",
  "edge_tooltip.wired": "Filaire",
  "edge_tooltip.wireless": "Sans fil",
  "entity_modal.device_info": "Informations sur l\u2019appareil",
  "entity_modal.device_type": "Type d\u2019appareil",
  "entity_modal.ip": "Adresse IP",
  "entity_modal.last_changed": "Dernier changement",
  "entity_modal.mac": "Adresse MAC",
  "entity_modal.model": "Mod\xE8le",
  "entity_modal.no_entities": "Aucune entit\xE9 Home Assistant trouv\xE9e pour cet appareil",
  "entity_modal.related_entities": "Entit\xE9s associ\xE9es",
  "entity_modal.related_entities_count": "Entit\xE9s associ\xE9es ({count})",
  "entity_modal.status": "Statut",
  "entity_modal.status_offline": "Hors ligne",
  "entity_modal.status_online": "En ligne",
  "entity_modal.status_unknown": "Inconnu",
  "panel.actions.copy_ip": "Copier l\u2019adresse IP",
  "panel.actions.copy_mac": "Copier l\u2019adresse MAC",
  "panel.actions.entity": "Entit\xE9",
  "panel.actions.no_entity": "Aucune entit\xE9 Home Assistant li\xE9e",
  "panel.actions.title": "Actions rapides",
  "panel.actions.view_entity": "Voir les d\xE9tails de l\u2019entit\xE9",
  "panel.actions.view_ports": "Voir l\u2019aper\xE7u des ports",
  "panel.badge.poe": "PoE",
  "panel.badge.wifi": "WiFi",
  "panel.connected_devices": "Appareils connect\xE9s",
  "panel.device_breakdown": "R\xE9partition des appareils",
  "panel.device_info": "Infos appareil",
  "panel.device_type.access_points": "Points d\u2019acc\xE8s",
  "panel.device_type.clients": "Clients",
  "panel.device_type.gateways": "Passerelles",
  "panel.device_type.other": "Autres",
  "panel.device_type.switches": "Commutateurs",
  "panel.entities": "Entit\xE9s Home Assistant",
  "panel.hint": "Cliquez sur un n\u0153ud de la carte pour voir les d\xE9tails",
  "panel.loading": "Chargement des donn\xE9es r\xE9seau...",
  "panel.network": "R\xE9seau",
  "panel.network_info": "Infos r\xE9seau",
  "panel.no_connections": "Aucune connexion",
  "panel.no_data": "Aucune donn\xE9e disponible",
  "panel.overview": "Vue d\u2019ensemble du r\xE9seau",
  "panel.overview.connections": "Connexions",
  "panel.overview.total_nodes": "Nombre total de n\u0153uds",
  "panel.stats.connection": "Statistiques de connexion",
  "panel.stats.connection_poe": "Aliment\xE9 par PoE",
  "panel.stats.ip": "Adresse IP",
  "panel.stats.mac": "Adresse MAC",
  "panel.stats.model": "Mod\xE8le",
  "panel.stats.total_connections": "Connexions totales",
  "panel.stats.wired": "Filaire",
  "panel.stats.wireless": "Sans fil",
  "panel.stats.wireless_clients": "Clients sans fil",
  "panel.status.last_changed": "Dernier changement",
  "panel.status.live": "\xC9tat en direct",
  "panel.status.offline": "Hors ligne",
  "panel.status.online": "En ligne",
  "panel.status.status": "Statut",
  "panel.status.unknown": "Inconnu",
  "panel.tabs.actions": "Actions",
  "panel.tabs.overview": "Vue d\u2019ensemble",
  "panel.tabs.stats": "Statistiques",
  "panel.vlan": "VLAN",
  "panel.vlan_id": "ID VLAN",
  "port_modal.empty": "Vide",
  "port_modal.no_ports": "Aucune information de port disponible",
  "port_modal.port": "Port {port}",
  "port_modal.title": "Aper\xE7u des ports",
  "toast.copied": "Copi\xE9\xA0!",
  "toast.copy_ip": "Adresse IP copi\xE9e\xA0!",
  "toast.copy_mac": "Adresse MAC copi\xE9e\xA0!",
  "toast.no_entity": "Aucune entit\xE9 trouv\xE9e pour cet appareil",
  "toast.restart_sent": "Commande de red\xE9marrage envoy\xE9e"
};

// src/card/shared/locales/nl.ts
var nl = {
  "card.controls.reset": "Reset",
  "card.controls.reset_view": "Weergave resetten",
  "card.controls.zoom_in": "Inzoomen",
  "card.controls.zoom_out": "Uitzoomen",
  "card.error.load_payload": "Laden van gegevens mislukt ({error})",
  "card.error.load_svg": "Laden van SVG mislukt ({error})",
  "card.error.missing_auth": "Authenticatietoken ontbreekt",
  "card.error.missing_config": "Configuratie ontbreekt",
  "card.error.missing_entry": "Selecteer een UniFi Network Map-instantie in de kaartinstellingen.",
  "card.error.retry": "Opnieuw proberen",
  "card.error.unknown": "Onbekende fout",
  "card.filter.hide": "{label} verbergen",
  "card.filter.show": "{label} tonen",
  "card.loading.aria": "Laden",
  "card.loading.map": "Kaart laden...",
  "card.loading.refresh": "Gegevens verversen...",
  "card.preview.alt": "UniFi Network Map voorbeeld",
  "card.time.days_ago": "{count}d geleden",
  "card.time.hours_ago": "{count}u geleden",
  "card.time.just_now": "Zojuist",
  "card.time.minutes_ago": "{count}m geleden",
  "card.time.unknown": "Onbekend",
  "context_menu.copy_ip": "IP-adres kopi\xEBren",
  "context_menu.copy_mac": "MAC-adres kopi\xEBren",
  "context_menu.restart": "Apparaat herstarten",
  "context_menu.view_details": "Details bekijken",
  "context_menu.view_ports": "Poorten bekijken",
  "editor.card_height": "Kaarthoogte (optioneel)",
  "editor.entry_id": "UniFi Network Map-instantie",
  "editor.no_entries": "Geen UniFi Network Map-integraties gevonden. Voeg er eerst \xE9\xE9n toe.",
  "editor.theme": "Thema",
  "editor.theme.dark": "Donker",
  "editor.theme.light": "Licht",
  "editor.theme.unifi": "UniFi (standaard)",
  "editor.theme.unifi_dark": "UniFi Donker",
  "editor.svg_theme": "Kaartkleuren",
  "editor.svg_theme.unifi": "UniFi (standaard)",
  "editor.svg_theme.unifi_dark": "UniFi Donker",
  "editor.svg_theme.minimal": "Minimaal",
  "editor.svg_theme.minimal_dark": "Minimaal Donker",
  "editor.svg_theme.classic": "Klassiek",
  "editor.svg_theme.classic_dark": "Klassiek Donker",
  "editor.icon_set": "Pictogramstijl",
  "editor.icon_set.modern": "Modern (standaard)",
  "editor.icon_set.isometric": "Isometrisch",
  "edge_tooltip.band_24": "2.4GHz",
  "edge_tooltip.band_5": "5GHz",
  "edge_tooltip.band_6": "6GHz",
  "edge_tooltip.channel": "Kanaal {channel}{suffix}",
  "edge_tooltip.poe": "PoE-gevoed",
  "edge_tooltip.speed_gbps": "{speed} Gbps",
  "edge_tooltip.speed_mbps": "{speed} Mbps",
  "edge_tooltip.wired": "Bekabeld",
  "edge_tooltip.wireless": "Draadloos",
  "entity_modal.device_info": "Apparaatinformatie",
  "entity_modal.device_type": "Apparaattype",
  "entity_modal.ip": "IP-adres",
  "entity_modal.last_changed": "Laatst gewijzigd",
  "entity_modal.mac": "MAC-adres",
  "entity_modal.model": "Model",
  "entity_modal.no_entities": "Geen Home Assistant-entiteiten gevonden voor dit apparaat",
  "entity_modal.related_entities": "Gerelateerde entiteiten",
  "entity_modal.related_entities_count": "Gerelateerde entiteiten ({count})",
  "entity_modal.status": "Status",
  "entity_modal.status_offline": "Offline",
  "entity_modal.status_online": "Online",
  "entity_modal.status_unknown": "Onbekend",
  "panel.actions.copy_ip": "IP-adres kopi\xEBren",
  "panel.actions.copy_mac": "MAC-adres kopi\xEBren",
  "panel.actions.entity": "Entiteit",
  "panel.actions.no_entity": "Geen Home Assistant-entiteit gekoppeld",
  "panel.actions.title": "Snelle acties",
  "panel.actions.view_entity": "Entiteitsdetails bekijken",
  "panel.actions.view_ports": "Poortoverzicht bekijken",
  "panel.badge.poe": "PoE",
  "panel.badge.wifi": "WiFi",
  "panel.connected_devices": "Verbonden apparaten",
  "panel.device_breakdown": "Apparaatoverzicht",
  "panel.device_info": "Apparaatinformatie",
  "panel.device_type.access_points": "Access points",
  "panel.device_type.clients": "Clients",
  "panel.device_type.gateways": "Gateways",
  "panel.device_type.other": "Overig",
  "panel.device_type.switches": "Switches",
  "panel.entities": "Home Assistant-entiteiten",
  "panel.hint": "Klik op een node in de kaart om details te zien",
  "panel.loading": "Netwerkgegevens laden...",
  "panel.network": "Netwerk",
  "panel.network_info": "Netwerkinformatie",
  "panel.no_connections": "Geen verbindingen",
  "panel.no_data": "Geen gegevens beschikbaar",
  "panel.overview": "Netwerkoverzicht",
  "panel.overview.connections": "Verbindingen",
  "panel.overview.total_nodes": "Totaal nodes",
  "panel.stats.connection": "Verbindingsstatistieken",
  "panel.stats.connection_poe": "PoE-gevoed",
  "panel.stats.ip": "IP-adres",
  "panel.stats.mac": "MAC-adres",
  "panel.stats.model": "Model",
  "panel.stats.total_connections": "Totaal verbindingen",
  "panel.stats.wired": "Bekabeld",
  "panel.stats.wireless": "Draadloos",
  "panel.stats.wireless_clients": "Draadloze clients",
  "panel.status.last_changed": "Laatst gewijzigd",
  "panel.status.live": "Live status",
  "panel.status.offline": "Offline",
  "panel.status.online": "Online",
  "panel.status.status": "Status",
  "panel.status.unknown": "Onbekend",
  "panel.tabs.actions": "Acties",
  "panel.tabs.overview": "Overzicht",
  "panel.tabs.stats": "Statistieken",
  "panel.vlan": "VLAN",
  "panel.vlan_id": "VLAN-ID",
  "port_modal.empty": "Leeg",
  "port_modal.no_ports": "Geen poortinformatie beschikbaar",
  "port_modal.port": "Poort {port}",
  "port_modal.title": "Poortoverzicht",
  "toast.copied": "Gekopieerd!",
  "toast.copy_ip": "IP-adres gekopieerd!",
  "toast.copy_mac": "MAC-adres gekopieerd!",
  "toast.no_entity": "Geen entiteit gevonden voor dit apparaat",
  "toast.restart_sent": "Herstartcommando verzonden"
};

// src/card/shared/localize.ts
var TRANSLATIONS = {
  de,
  en,
  es,
  fr,
  nl
};
function normalizeLanguage(language) {
  if (!language) return void 0;
  const base = language.toLowerCase().split("-")[0];
  return base in TRANSLATIONS ? base : void 0;
}
function formatTemplate(template, replacements) {
  if (!replacements) return template;
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    const token = `{${key}}`;
    result = result.split(token).join(String(value));
  }
  return result;
}
function createLocalize(hass) {
  const language = normalizeLanguage(hass?.locale?.language) || normalizeLanguage(hass?.language) || normalizeLanguage(navigator.language) || "en";
  return (key, replacements) => {
    const dict = TRANSLATIONS[language] ?? TRANSLATIONS.en;
    const template = dict[key] ?? TRANSLATIONS.en[key] ?? key;
    return formatTemplate(template, replacements);
  };
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
    (action, mac, ip) => params.onAction(action, params.menu.nodeName, mac, ip)
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
    onAction(result.action, result.mac, result.ip);
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

// src/card/ui/filter-bar.ts
function countDeviceTypes(nodeTypes) {
  const counts = {
    gateway: 0,
    switch: 0,
    ap: 0,
    client: 0,
    other: 0
  };
  for (const type of Object.values(nodeTypes)) {
    if (type === "gateway" || type === "switch" || type === "ap") {
      counts[type]++;
    } else if (CLIENT_SUBTYPES.includes(type)) {
      counts.client++;
    } else {
      counts.other++;
    }
  }
  return counts;
}

// src/card/interaction/viewport.ts
var BASE_VIEWBOXES = /* @__PURE__ */ new WeakMap();
function bindViewportInteractions(params) {
  const { viewport, svg: svg3, state, options, handlers, callbacks, bindings } = params;
  viewport.onwheel = (event) => onWheel(event, svg3, state, options, callbacks);
  viewport.onpointerdown = (event) => onPointerDown(event, state, bindings.controls);
  viewport.onpointermove = (event) => onPointerMove(event, svg3, state, options, handlers, callbacks, bindings.tooltip);
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
function applyTransform(svg3, transform, isPanning) {
  svg3.style.cursor = isPanning ? "grabbing" : "grab";
  svg3.style.transform = "none";
  const baseViewBox = getBaseViewBox(svg3);
  if (!baseViewBox) {
    return;
  }
  const viewportSize = getViewportSize(svg3);
  const viewBox = computeViewBox(transform, baseViewBox, viewportSize);
  setViewBox(svg3, viewBox);
}
function applyZoom(svg3, delta, state, options, callbacks) {
  const nextScale = Math.min(
    options.maxZoomScale,
    Math.max(options.minZoomScale, state.viewTransform.scale + delta)
  );
  state.viewTransform.scale = Number(nextScale.toFixed(2));
  callbacks.onUpdateTransform(state.viewTransform);
  applyTransform(svg3, state.viewTransform, state.isPanning);
}
function resetPan(svg3, state, callbacks) {
  state.viewTransform = { x: 0, y: 0, scale: 1 };
  callbacks.onUpdateTransform(state.viewTransform);
  applyTransform(svg3, state.viewTransform, state.isPanning);
}
function onWheel(event, svg3, state, options, callbacks) {
  event.preventDefault();
  const delta = event.deltaY > 0 ? -options.zoomIncrement : options.zoomIncrement;
  applyZoom(svg3, delta, state, options, callbacks);
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
function onPointerMove(event, svg3, state, options, handlers, callbacks, tooltip) {
  updateActivePointer(state, event);
  if (handlePinchZoom(svg3, state, options, callbacks)) {
    return;
  }
  if (handlePan(svg3, state, event, options, callbacks)) {
    return;
  }
  handleHover(event, options, handlers, callbacks, tooltip);
}
function updateActivePointer(state, event) {
  if (state.activePointers.has(event.pointerId)) {
    state.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  }
}
function handlePinchZoom(svg3, state, options, callbacks) {
  if (state.activePointers.size !== 2 || state.pinchStartDistance === null || state.pinchStartScale === null) {
    return false;
  }
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
  applyTransform(svg3, state.viewTransform, state.isPanning);
  return true;
}
function handlePan(svg3, state, event, options, callbacks) {
  if (!state.isPanning || !state.panStart) {
    return false;
  }
  const nextX = event.clientX - state.panStart.x;
  const nextY = event.clientY - state.panStart.y;
  if (Math.abs(nextX - state.viewTransform.x) > options.minPanMovementThreshold || Math.abs(nextY - state.viewTransform.y) > options.minPanMovementThreshold) {
    state.panMoved = true;
  }
  state.viewTransform.x = nextX;
  state.viewTransform.y = nextY;
  callbacks.onUpdateTransform(state.viewTransform);
  applyTransform(svg3, state.viewTransform, state.isPanning);
  return true;
}
function handleHover(event, options, handlers, callbacks, tooltip) {
  const edge = handlers.findEdge(event.target);
  if (edge) {
    showEdgeTooltip(edge, event, options, handlers, callbacks, tooltip);
    return;
  }
  callbacks.onHoverEdge(null);
  const label = handlers.resolveNodeName(event);
  if (!label) {
    callbacks.onHoverNode(null);
    hideTooltip(tooltip);
    return;
  }
  showNodeTooltip(label, event, options, callbacks, tooltip);
}
function showEdgeTooltip(edge, event, options, handlers, callbacks, tooltip) {
  callbacks.onHoverEdge(edge);
  callbacks.onHoverNode(null);
  tooltip.hidden = false;
  tooltip.classList.add("unifi-network-map__tooltip--edge");
  tooltip.innerHTML = handlers.renderEdgeTooltip(edge);
  tooltip.style.transform = "none";
  positionTooltip(tooltip, event, options.tooltipOffsetPx);
}
function showNodeTooltip(label, event, options, callbacks, tooltip) {
  callbacks.onHoverNode(label);
  tooltip.hidden = false;
  tooltip.classList.remove("unifi-network-map__tooltip--edge");
  tooltip.textContent = label;
  tooltip.style.transform = "none";
  positionTooltip(tooltip, event, options.tooltipOffsetPx);
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
  let label = handlers.resolveNodeName(event);
  if (!label) {
    const viewport = event.currentTarget || event.target?.closest(".unifi-network-map__viewport");
    const svg3 = viewport?.querySelector("svg");
    if (svg3) {
      label = findNodeAtPoint(svg3, event.clientX, event.clientY);
    }
  }
  if (!label) {
    return;
  }
  callbacks.onNodeSelected(label);
  hideTooltip(tooltip);
}
function onContextMenu(event, state, handlers, callbacks) {
  let nodeName = handlers.resolveNodeName(event);
  if (!nodeName) {
    const viewport = event.currentTarget || event.target?.closest(".unifi-network-map__viewport");
    const svg3 = viewport?.querySelector("svg");
    if (svg3) {
      nodeName = findNodeAtPoint(svg3, event.clientX, event.clientY);
    }
  }
  if (!nodeName) {
    return;
  }
  event.preventDefault();
  callbacks.onOpenContextMenu(event.clientX, event.clientY, nodeName);
}
function findNodeAtPoint(svg3, clientX, clientY) {
  const nodes = svg3.querySelectorAll("[data-node-id]");
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
      return node.getAttribute("data-node-id");
    }
  }
  return null;
}
function hideTooltip(tooltip) {
  tooltip.hidden = true;
  tooltip.classList.remove("unifi-network-map__tooltip--edge");
}
function positionTooltip(tooltip, event, offset) {
  const viewport = event.currentTarget ?? tooltip.closest(".unifi-network-map__viewport");
  const viewportRect = viewport?.getBoundingClientRect();
  if (!viewportRect) {
    tooltip.style.left = `${event.clientX + offset}px`;
    tooltip.style.top = `${event.clientY + offset}px`;
    return;
  }
  const cursorX = event.clientX - viewportRect.left;
  const cursorY = event.clientY - viewportRect.top;
  let left = cursorX + offset;
  let top = cursorY + offset;
  const tooltipRect = tooltip.getBoundingClientRect();
  const tooltipWidth = tooltipRect.width || 150;
  const tooltipHeight = tooltipRect.height || 40;
  if (left + tooltipWidth > viewportRect.width) {
    left = cursorX - tooltipWidth - offset;
  }
  if (top + tooltipHeight > viewportRect.height) {
    top = cursorY - tooltipHeight - offset;
  }
  if (left < 0) {
    left = offset;
  }
  if (top < 0) {
    top = offset;
  }
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}
function isControlTarget(target, controls) {
  if (target?.closest(".filter-bar") || target?.closest(".filter-bar-container")) {
    return true;
  }
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
function getBaseViewBox(svg3) {
  const cached = BASE_VIEWBOXES.get(svg3);
  if (cached) return cached;
  const fromAttribute = parseViewBox(svg3.getAttribute("viewBox"));
  const base = fromAttribute ?? buildFallbackViewBox(svg3);
  if (!base) return null;
  BASE_VIEWBOXES.set(svg3, base);
  if (!fromAttribute) {
    setViewBox(svg3, base);
  }
  return base;
}
function parseViewBox(value) {
  if (!value) return null;
  const parts = value.trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }
  return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
}
function buildFallbackViewBox(svg3) {
  return viewBoxFromSizeAttributes(svg3) ?? viewBoxFromBoundingBox(svg3) ?? viewBoxFromRect(svg3);
}
function viewBoxFromSizeAttributes(svg3) {
  const width = readNumericAttribute(svg3, "width");
  const height = readNumericAttribute(svg3, "height");
  if (!width || !height) return null;
  return { x: 0, y: 0, width, height };
}
function readNumericAttribute(svg3, name) {
  const value = svg3.getAttribute(name);
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function viewBoxFromBoundingBox(svg3) {
  try {
    const bbox = svg3.getBBox();
    if (!bbox.width || !bbox.height) return null;
    return { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
  } catch {
    return null;
  }
}
function viewBoxFromRect(svg3) {
  const rect = svg3.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  return { x: 0, y: 0, width: rect.width, height: rect.height };
}
function getViewportSize(svg3) {
  const rect = svg3.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}
function computeViewBox(transform, base, viewportSize) {
  const scale = transform.scale || 1;
  const width = base.width / scale;
  const height = base.height / scale;
  const xOffset = panOffset(transform.x, base.width, viewportSize.width, scale);
  const yOffset = panOffset(transform.y, base.height, viewportSize.height, scale);
  return { x: base.x - xOffset, y: base.y - yOffset, width, height };
}
function panOffset(panPx, baseSize, viewportSize, scale) {
  if (!viewportSize || !scale) return 0;
  return panPx * baseSize / (viewportSize * scale);
}
function setViewBox(svg3, viewBox) {
  const values = [viewBox.x, viewBox.y, viewBox.width, viewBox.height].map(
    (value) => Number(value.toFixed(2))
  );
  svg3.setAttribute("viewBox", values.join(" "));
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
function createDefaultViewportHandlers(edges, getIcon, localize) {
  return {
    resolveNodeName: (event) => resolveNodeName(event),
    findEdge: (target) => edges ? findEdgeFromTarget(target, edges) : null,
    renderEdgeTooltip: (edge) => renderEdgeTooltip(edge, getIcon, localize)
  };
}

// src/card/ui/styles.ts
var CARD_STYLES = `
  unifi-network-map { display: block; }
  unifi-network-map ha-card { display: flex; flex-direction: column; box-sizing: border-box; }
  .unifi-network-map__layout { display: grid; grid-template-columns: minmax(0, 2.5fr) minmax(280px, 1fr); gap: 12px; padding: 12px; flex: 1; min-height: 0; height: 100%; }
  .unifi-network-map__viewport { position: relative; overflow: hidden; min-height: 300px; background: linear-gradient(135deg, #0b1016 0%, #111827 100%); border-radius: 12px; touch-action: none; contain: strict; isolation: isolate; height: 100%; }
  .unifi-network-map__viewport > svg { width: 100%; height: 100%; display: block; position: absolute; top: 0; left: 0; z-index: 0; }
  .unifi-network-map__viewport > svg, .unifi-network-map__viewport > svg * { pointer-events: bounding-box !important; }
  .unifi-icon { display: inline-flex; align-items: center; justify-content: center; line-height: 1; }
  .unifi-icon svg { width: 1em; height: 1em; stroke: currentColor; fill: none; }
  .unifi-network-map__controls { position: absolute; top: 8px; right: 8px; display: flex; gap: 6px; z-index: 3; }
  .unifi-network-map__controls button { background: rgba(15, 23, 42, 0.9); color: #e5e7eb; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 6px 10px; font-size: 12px; cursor: pointer; backdrop-filter: blur(8px); transition: all 0.15s ease; }
  .unifi-network-map__controls button:hover { background: rgba(59, 130, 246, 0.3); border-color: rgba(59, 130, 246, 0.5); }
  .unifi-network-map__viewport > svg text, .unifi-network-map__viewport > svg g { cursor: pointer; }
  .unifi-network-map__viewport > svg path[data-edge] { cursor: pointer; transition: stroke-width 0.15s ease, filter 0.15s ease; pointer-events: stroke; }
  .unifi-network-map__viewport > svg path[data-edge-hitbox] { stroke: transparent; stroke-width: 14; fill: none; pointer-events: stroke; }
  .unifi-network-map__viewport > svg path[data-edge]:hover { stroke-width: 4; filter: drop-shadow(0 0 4px currentColor); }

  /* Filter Bar */
  .filter-bar-container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    z-index: 10;
    pointer-events: none;
  }
  .filter-bar {
    position: relative;
    bottom: 8px;
    z-index: 10;
    display: flex;
    gap: 4px;
    padding: 6px 8px;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    backdrop-filter: blur(8px);
    pointer-events: auto;
  }
  .filter-button {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #e5e7eb;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
    pointer-events: auto;
  }
  .filter-button:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.4);
  }
  .filter-button--active {
    background: rgba(59, 130, 246, 0.25);
    border-color: rgba(59, 130, 246, 0.5);
  }
  .filter-button--inactive {
    opacity: 0.5;
  }
  .filter-button--inactive:hover {
    opacity: 0.8;
  }
  .filter-button__icon {
    font-size: 14px;
    line-height: 1;
  }
  .filter-button__count {
    font-weight: 600;
    min-width: 16px;
    text-align: center;
  }

  /* Filtered nodes and edges */
  .unifi-network-map__viewport > svg .node--filtered,
  .unifi-network-map__viewport > svg .edge--filtered {
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }
  .unifi-network-map__panel { padding: 0; background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); color: #e5e7eb; border-radius: 12px; font-size: 13px; overflow: hidden; display: flex; flex-direction: column; contain: strict; min-height: 0; height: 100%; }
  .unifi-network-map__tooltip { position: absolute; z-index: 2; background: rgba(15, 23, 42, 0.95); color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 12px; pointer-events: none; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(8px); max-width: 280px; }
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
  .panel-tab-content { flex: 1; overflow-y: auto; padding: 16px; min-height: 0; }

  /* Sections */
  .panel-section { margin-bottom: 16px; padding: 0 16px; }
  .panel-section__title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 8px; }

  /* Stats Compact */
  .panel-stats-compact { display: flex; align-items: baseline; gap: 6px; padding: 8px 16px; }
  .panel-stats-compact__value { font-size: 18px; font-weight: 700; color: #60a5fa; }
  .panel-stats-compact__label { font-size: 12px; color: #94a3b8; }

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
  .neighbor-list--compact { gap: 4px; }
  .neighbor-item { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; background: rgba(255,255,255,0.03); border-radius: 8px; transition: background 0.15s ease; }
  .neighbor-item--compact { flex-direction: row; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 10px; }
  .neighbor-item:hover { background: rgba(255,255,255,0.06); }
  .neighbor-item__name { color: #e2e8f0; font-size: 13px; font-weight: 500; word-break: break-word; }
  .neighbor-item--compact .neighbor-item__name { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .neighbor-item__badges { display: flex; flex-wrap: wrap; gap: 4px; }
  .neighbor-item--compact .neighbor-item__badges { flex-shrink: 0; flex-wrap: nowrap; }
  .neighbor-item__name--link { text-decoration: none; cursor: pointer; transition: color 0.15s ease; }
  .neighbor-item__name--link:hover { color: #60a5fa; text-decoration: underline; }

  /* Entity List */
  .entity-list { display: flex; flex-direction: column; gap: 6px; }
  .entity-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: rgba(255,255,255,0.03); border-radius: 8px; transition: background 0.15s ease; cursor: pointer; }
  .entity-item:hover { background: rgba(255,255,255,0.06); }
  .entity-item__icon { font-size: 16px; flex-shrink: 0; }
  .entity-item__info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .entity-item__name { color: #e2e8f0; font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .entity-item__id { color: #64748b; font-size: 10px; font-family: ui-monospace, monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .entity-item__state { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 10px; flex-shrink: 0; max-width: 90px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .entity-item__state--on { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
  .entity-item__state--off { background: rgba(107, 114, 128, 0.2); color: #9ca3af; }
  .entity-item__state--neutral { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
  .entity-item__state--unknown { background: rgba(107, 114, 128, 0.15); color: #6b7280; }

  /* Badges */
  .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500; }
  .badge--wireless { background: rgba(168, 85, 247, 0.2); color: #c084fc; }
  .badge--poe { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
  .badge--poe-inactive { background: rgba(148, 163, 184, 0.15); color: #64748b; }
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

  /* Preview */
  .unifi-network-map__preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16px;
    gap: 12px;
    min-height: 200px;
  }
  .unifi-network-map__preview img {
    max-width: 100%;
    max-height: 200px;
    border-radius: 8px;
    opacity: 0.9;
  }
  .unifi-network-map__preview-text {
    font-size: 12px;
    color: #94a3b8;
    text-align: center;
  }

  /* Info Row */
  .info-row { display: flex; flex-direction: column; gap: 4px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 8px; }
  .info-row:last-child { margin-bottom: 0; }
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
  .unifi-network-map__viewport > svg [data-selected="true"],
  .unifi-network-map__viewport > svg .node--selected {
    filter: none;
  }
  .unifi-network-map__viewport > svg [data-selected="true"] > *,
  .unifi-network-map__viewport > svg .node--selected > * {
    stroke: #3b82f6 !important;
    stroke-width: 2.5px;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .unifi-network-map__viewport > svg [data-selected="true"] text,
  .unifi-network-map__viewport > svg .node--selected text {
    stroke: none !important;
    fill: #3b82f6 !important;
  }

  /* Light theme overrides */
  ha-card[data-theme="light"] .unifi-network-map__controls button { background: rgba(226, 232, 240, 0.9); color: #0f172a; border-color: rgba(148, 163, 184, 0.5); }
  ha-card[data-theme="light"] .unifi-network-map__retry { background: #3b82f6; border-color: #3b82f6; color: #ffffff; }
  ha-card[data-theme="light"] .unifi-network-map__retry:hover { background: #2563eb; }
  ha-card[data-theme="light"] .unifi-network-map__error-text { color: #0f172a; }
  ha-card[data-theme="light"] .unifi-network-map__panel { background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%); color: #0f172a; }
  ha-card[data-theme="light"] .panel-header { background: rgba(148, 163, 184, 0.15); border-bottom-color: rgba(148, 163, 184, 0.3); }
  ha-card[data-theme="light"] .panel-header__title { color: #0f172a; }
  ha-card[data-theme="light"] .panel-header__badge { background: rgba(59, 130, 246, 0.15); color: #1d4ed8; }
  ha-card[data-theme="light"] .panel-tab { color: #64748b; }
  ha-card[data-theme="light"] .panel-tab--active { color: #1d4ed8; border-bottom-color: #3b82f6; }
  ha-card[data-theme="light"] .panel-section__title { color: #475569; }
  ha-card[data-theme="light"] .panel-stats-compact__label { color: #64748b; }
  ha-card[data-theme="light"] .device-row { background: rgba(15, 23, 42, 0.04); }
  ha-card[data-theme="light"] .device-row__label { color: #0f172a; }
  ha-card[data-theme="light"] .device-row__count { color: #1d4ed8; }
  ha-card[data-theme="light"] .neighbor-item { background: rgba(15, 23, 42, 0.04); }
  ha-card[data-theme="light"] .neighbor-item__name { color: #0f172a; }
  ha-card[data-theme="light"] .neighbor-item__name--link:hover { color: #1d4ed8; }
  ha-card[data-theme="light"] .entity-item { background: rgba(15, 23, 42, 0.04); }
  ha-card[data-theme="light"] .entity-item__name { color: #0f172a; }
  ha-card[data-theme="light"] .entity-item__id { color: #64748b; }
  ha-card[data-theme="light"] .entity-item__state--on { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
  ha-card[data-theme="light"] .entity-item__state--neutral { background: rgba(59, 130, 246, 0.1); color: #1d4ed8; }
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
  ha-card[data-theme="light"] .filter-bar { background: rgba(241, 245, 249, 0.95); border-color: rgba(148, 163, 184, 0.4); }
  ha-card[data-theme="light"] .filter-button { background: rgba(15, 23, 42, 0.05); border-color: rgba(148, 163, 184, 0.3); color: #0f172a; }
  ha-card[data-theme="light"] .filter-button:hover { background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.4); }
  ha-card[data-theme="light"] .filter-button--active { background: rgba(59, 130, 246, 0.2); border-color: rgba(59, 130, 246, 0.5); }
  ha-card[data-theme="light"] .status-badge--online { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
  ha-card[data-theme="light"] .status-badge--offline { background: rgba(239, 68, 68, 0.15); color: #dc2626; }
  ha-card[data-theme="light"] .status-badge--unknown { background: rgba(107, 114, 128, 0.15); color: #6b7280; }

  @media (max-width: 800px) {
    .unifi-network-map__layout { grid-template-columns: 1fr; }
  }

  /* UniFi theme - matches official UniFi Network application style */
  ha-card[data-theme="unifi"] { background: #f7f8fa; }
  ha-card[data-theme="unifi"] .unifi-network-map__viewport { background: #ffffff; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); }
  ha-card[data-theme="unifi"] .unifi-network-map__controls button { background: #ffffff; color: #374151; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); }
  ha-card[data-theme="unifi"] .unifi-network-map__controls button:hover { background: #f3f4f6; border-color: #006fff; color: #006fff; }
  ha-card[data-theme="unifi"] .unifi-network-map__retry { background: #006fff; border-color: #006fff; color: #ffffff; }
  ha-card[data-theme="unifi"] .unifi-network-map__retry:hover { background: #0058cc; }
  ha-card[data-theme="unifi"] .unifi-network-map__error-text { color: #374151; }
  ha-card[data-theme="unifi"] .unifi-network-map__panel { background: #ffffff; color: #1a1a1a; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); }
  ha-card[data-theme="unifi"] .panel-header { background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
  ha-card[data-theme="unifi"] .panel-header__title { color: #1a1a1a; }
  ha-card[data-theme="unifi"] .panel-header__back { background: #ffffff; border-color: #e5e7eb; color: #6b7280; }
  ha-card[data-theme="unifi"] .panel-header__back:hover { background: #f3f4f6; border-color: #006fff; color: #006fff; }
  ha-card[data-theme="unifi"] .panel-header__badge { background: rgba(0, 111, 255, 0.1); color: #006fff; }
  ha-card[data-theme="unifi"] .panel-tabs { background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
  ha-card[data-theme="unifi"] .panel-tab { color: #6b7280; }
  ha-card[data-theme="unifi"] .panel-tab:hover { color: #374151; }
  ha-card[data-theme="unifi"] .panel-tab--active { color: #006fff; border-bottom-color: #006fff; }
  ha-card[data-theme="unifi"] .panel-section__title { color: #6b7280; }
  ha-card[data-theme="unifi"] .panel-stats-compact__value { color: #006fff; }
  ha-card[data-theme="unifi"] .panel-stats-compact__label { color: #6b7280; }
  ha-card[data-theme="unifi"] .stats-row { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
  ha-card[data-theme="unifi"] .stats-row__label { color: #6b7280; }
  ha-card[data-theme="unifi"] .stats-row__value { color: #1a1a1a; }
  ha-card[data-theme="unifi"] .device-row { background: #f9fafb; border: 1px solid #e5e7eb; }
  ha-card[data-theme="unifi"] .device-row__label { color: #1a1a1a; }
  ha-card[data-theme="unifi"] .device-row__count { color: #006fff; background: rgba(0, 111, 255, 0.1); }
  ha-card[data-theme="unifi"] .neighbor-item { background: #f9fafb; border: 1px solid #e5e7eb; }
  ha-card[data-theme="unifi"] .neighbor-item:hover { background: #f3f4f6; border-color: #006fff; }
  ha-card[data-theme="unifi"] .neighbor-item__name { color: #1a1a1a; }
  ha-card[data-theme="unifi"] .neighbor-item__name--link:hover { color: #006fff; }
  ha-card[data-theme="unifi"] .entity-item { background: #f9fafb; border: 1px solid #e5e7eb; }
  ha-card[data-theme="unifi"] .entity-item:hover { background: #f3f4f6; border-color: #006fff; }
  ha-card[data-theme="unifi"] .entity-item__name { color: #1a1a1a; }
  ha-card[data-theme="unifi"] .entity-item__id { color: #6b7280; }
  ha-card[data-theme="unifi"] .entity-item__state--on { background: rgba(0, 168, 107, 0.1); color: #00a86b; }
  ha-card[data-theme="unifi"] .entity-item__state--neutral { background: rgba(0, 111, 255, 0.1); color: #006fff; }
  ha-card[data-theme="unifi"] .info-row { background: #f9fafb; border: 1px solid #e5e7eb; }
  ha-card[data-theme="unifi"] .info-row__label { color: #6b7280; }
  ha-card[data-theme="unifi"] .info-row__value { color: #006fff; }
  ha-card[data-theme="unifi"] .action-button { background: #ffffff; border: 1px solid #e5e7eb; color: #374151; }
  ha-card[data-theme="unifi"] .action-button:hover { background: #f3f4f6; border-color: #006fff; color: #006fff; }
  ha-card[data-theme="unifi"] .action-button--primary { background: #006fff; border-color: #006fff; color: #ffffff; }
  ha-card[data-theme="unifi"] .action-button--primary:hover { background: #0058cc; }
  ha-card[data-theme="unifi"] .entity-id { background: #f3f4f6; color: #006fff; border: 1px solid #e5e7eb; }
  ha-card[data-theme="unifi"] .panel-empty__text { color: #6b7280; }
  ha-card[data-theme="unifi"] .panel-hint { background: rgba(0, 111, 255, 0.05); color: #374151; border: 1px solid rgba(0, 111, 255, 0.2); }
  ha-card[data-theme="unifi"] .unifi-network-map__tooltip { background: #1a1a1a; border: none; }
  ha-card[data-theme="unifi"] .status-badge--online { background: rgba(0, 168, 107, 0.1); color: #00a86b; }
  ha-card[data-theme="unifi"] .status-badge--offline { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
  ha-card[data-theme="unifi"] .status-badge--unknown { background: rgba(107, 114, 128, 0.1); color: #6b7280; }
  ha-card[data-theme="unifi"] .status-dot--online { background: #00a86b; box-shadow: 0 0 6px rgba(0, 168, 107, 0.5); }
  ha-card[data-theme="unifi"] .badge--wireless { background: rgba(168, 85, 247, 0.1); color: #9333ea; }
  ha-card[data-theme="unifi"] .badge--poe { background: rgba(0, 168, 107, 0.1); color: #00a86b; }
  ha-card[data-theme="unifi"] .badge--poe-inactive { background: #f3f4f6; color: #9ca3af; }
  ha-card[data-theme="unifi"] .badge--port { background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; }
  ha-card[data-theme="unifi"] .unifi-network-map__viewport > svg [data-selected="true"] > *,
  ha-card[data-theme="unifi"] .unifi-network-map__viewport > svg .node--selected > * { stroke: #006fff !important; }
  ha-card[data-theme="unifi"] .unifi-network-map__viewport > svg [data-selected="true"] text,
  ha-card[data-theme="unifi"] .unifi-network-map__viewport > svg .node--selected text { stroke: none !important; fill: #006fff !important; }
  ha-card[data-theme="unifi"] .filter-bar { background: #ffffff; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); }
  ha-card[data-theme="unifi"] .filter-button { background: #f9fafb; border: 1px solid #e5e7eb; color: #374151; }
  ha-card[data-theme="unifi"] .filter-button:hover { background: #f3f4f6; border-color: #006fff; color: #006fff; }
  ha-card[data-theme="unifi"] .filter-button--active { background: rgba(0, 111, 255, 0.1); border-color: #006fff; color: #006fff; }

  /* UniFi Dark theme - dark mode version of UniFi style */
  ha-card[data-theme="unifi-dark"] { background: #0d0d0d; }
  ha-card[data-theme="unifi-dark"] .unifi-network-map__viewport { background: #1a1a1a; border: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .unifi-network-map__controls button { background: #1a1a1a; color: #e5e5e5; border: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .unifi-network-map__controls button:hover { background: #252525; border-color: #006fff; color: #006fff; }
  ha-card[data-theme="unifi-dark"] .unifi-network-map__panel { background: #1a1a1a; color: #e5e5e5; border: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .panel-header { background: #151515; border-bottom: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .panel-header__title { color: #ffffff; }
  ha-card[data-theme="unifi-dark"] .panel-header__back { background: #1a1a1a; border-color: #2a2a2a; color: #9ca3af; }
  ha-card[data-theme="unifi-dark"] .panel-header__back:hover { background: #252525; border-color: #006fff; color: #006fff; }
  ha-card[data-theme="unifi-dark"] .panel-header__badge { background: rgba(0, 111, 255, 0.15); color: #3b9eff; }
  ha-card[data-theme="unifi-dark"] .panel-tabs { background: #151515; border-bottom: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .panel-tab { color: #9ca3af; }
  ha-card[data-theme="unifi-dark"] .panel-tab:hover { color: #e5e5e5; }
  ha-card[data-theme="unifi-dark"] .panel-tab--active { color: #3b9eff; border-bottom-color: #006fff; }
  ha-card[data-theme="unifi-dark"] .panel-section__title { color: #9ca3af; }
  ha-card[data-theme="unifi-dark"] .panel-stats-compact__value { color: #3b9eff; }
  ha-card[data-theme="unifi-dark"] .panel-stats-compact__label { color: #9ca3af; }
  ha-card[data-theme="unifi-dark"] .stats-row { background: #151515; border: 1px solid #2a2a2a; border-radius: 8px; }
  ha-card[data-theme="unifi-dark"] .stats-row__label { color: #9ca3af; }
  ha-card[data-theme="unifi-dark"] .stats-row__value { color: #e5e5e5; }
  ha-card[data-theme="unifi-dark"] .device-row { background: #151515; border: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .device-row__label { color: #e5e5e5; }
  ha-card[data-theme="unifi-dark"] .device-row__count { color: #3b9eff; background: rgba(0, 111, 255, 0.15); }
  ha-card[data-theme="unifi-dark"] .neighbor-item { background: #151515; border: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .neighbor-item:hover { background: #1f1f1f; border-color: #006fff; }
  ha-card[data-theme="unifi-dark"] .neighbor-item__name { color: #e5e5e5; }
  ha-card[data-theme="unifi-dark"] .neighbor-item__name--link:hover { color: #3b9eff; }
  ha-card[data-theme="unifi-dark"] .entity-item { background: #151515; border: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .entity-item:hover { background: #1f1f1f; border-color: #006fff; }
  ha-card[data-theme="unifi-dark"] .entity-item__name { color: #e5e5e5; }
  ha-card[data-theme="unifi-dark"] .entity-item__id { color: #9ca3af; }
  ha-card[data-theme="unifi-dark"] .entity-item__state--on { background: rgba(0, 168, 107, 0.15); color: #00d68f; }
  ha-card[data-theme="unifi-dark"] .entity-item__state--neutral { background: rgba(0, 111, 255, 0.15); color: #3b9eff; }
  ha-card[data-theme="unifi-dark"] .info-row { background: #151515; border: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .info-row__label { color: #9ca3af; }
  ha-card[data-theme="unifi-dark"] .info-row__value { color: #3b9eff; }
  ha-card[data-theme="unifi-dark"] .action-button { background: #1a1a1a; border: 1px solid #2a2a2a; color: #e5e5e5; }
  ha-card[data-theme="unifi-dark"] .action-button:hover { background: #252525; border-color: #006fff; color: #006fff; }
  ha-card[data-theme="unifi-dark"] .action-button--primary { background: #006fff; border-color: #006fff; color: #ffffff; }
  ha-card[data-theme="unifi-dark"] .action-button--primary:hover { background: #0058cc; }
  ha-card[data-theme="unifi-dark"] .entity-id { background: #151515; color: #3b9eff; border: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .panel-empty__text { color: #9ca3af; }
  ha-card[data-theme="unifi-dark"] .panel-hint { background: rgba(0, 111, 255, 0.1); color: #e5e5e5; border: 1px solid rgba(0, 111, 255, 0.2); }
  ha-card[data-theme="unifi-dark"] .unifi-network-map__tooltip { background: #0d0d0d; border: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .status-badge--online { background: rgba(0, 168, 107, 0.15); color: #00d68f; }
  ha-card[data-theme="unifi-dark"] .status-badge--offline { background: rgba(239, 68, 68, 0.15); color: #f87171; }
  ha-card[data-theme="unifi-dark"] .status-badge--unknown { background: rgba(156, 163, 175, 0.15); color: #9ca3af; }
  ha-card[data-theme="unifi-dark"] .status-dot--online { background: #00d68f; box-shadow: 0 0 6px rgba(0, 214, 143, 0.5); }
  ha-card[data-theme="unifi-dark"] .badge--wireless { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
  ha-card[data-theme="unifi-dark"] .badge--poe { background: rgba(0, 168, 107, 0.15); color: #00d68f; }
  ha-card[data-theme="unifi-dark"] .badge--poe-inactive { background: #1f1f1f; color: #6b7280; }
  ha-card[data-theme="unifi-dark"] .badge--port { background: #1f1f1f; color: #9ca3af; border: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .unifi-network-map__viewport > svg [data-selected="true"] > *,
  ha-card[data-theme="unifi-dark"] .unifi-network-map__viewport > svg .node--selected > * { stroke: #006fff !important; }
  ha-card[data-theme="unifi-dark"] .unifi-network-map__viewport > svg [data-selected="true"] text,
  ha-card[data-theme="unifi-dark"] .unifi-network-map__viewport > svg .node--selected text { stroke: none !important; fill: #3b9eff !important; }
  ha-card[data-theme="unifi-dark"] .filter-bar { background: #1a1a1a; border: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .filter-button { background: #151515; border: 1px solid #2a2a2a; color: #e5e5e5; }
  ha-card[data-theme="unifi-dark"] .filter-button:hover { background: #252525; border-color: #006fff; color: #3b9eff; }
  ha-card[data-theme="unifi-dark"] .filter-button--active { background: rgba(0, 111, 255, 0.15); border-color: #006fff; color: #3b9eff; }

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
    overflow-x: hidden;
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
    padding-bottom: 28px;
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
    overflow: hidden;
    max-width: 100%;
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
    overflow: hidden;
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
    max-width: 100px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

  /* UniFi theme entity modal */
  .entity-modal-overlay[data-theme="unifi"] .entity-modal { background: #ffffff; border: 1px solid #e5e7eb; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__header { background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__title { color: #1a1a1a; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__close { color: #6b7280; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__close:hover { background: #f3f4f6; color: #1a1a1a; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__section-title { color: #6b7280; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__info-row { background: #f9fafb; border: 1px solid #e5e7eb; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__info-label { color: #6b7280; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__info-value { color: #1a1a1a; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__entity-item { background: #f9fafb; border: 1px solid #e5e7eb; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__entity-item:hover { background: #f3f4f6; border-color: #006fff; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__entity-name { color: #1a1a1a; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__entity-id { color: #6b7280; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__state-badge--home,
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__state-badge--on { background: rgba(0, 168, 107, 0.1); color: #00a86b; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__state-badge--not_home,
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__state-badge--off { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__state-badge--default { background: #f3f4f6; color: #6b7280; }

  /* UniFi theme context menu */
  .context-menu[data-theme="unifi"] { background: #ffffff; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
  .context-menu[data-theme="unifi"] .context-menu__header { border-bottom: 1px solid #e5e7eb; }
  .context-menu[data-theme="unifi"] .context-menu__title { color: #1a1a1a; }
  .context-menu[data-theme="unifi"] .context-menu__type { color: #6b7280; }
  .context-menu[data-theme="unifi"] .context-menu__item { color: #374151; }
  .context-menu[data-theme="unifi"] .context-menu__item:hover { background: rgba(0, 111, 255, 0.1); color: #006fff; }
  .context-menu[data-theme="unifi"] .context-menu__item--danger:hover { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
  .context-menu[data-theme="unifi"] .context-menu__divider { background: #e5e7eb; }

  /* UniFi Dark theme entity modal */
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal { background: #1a1a1a; border: 1px solid #2a2a2a; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__header { background: #151515; border-bottom: 1px solid #2a2a2a; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__title { color: #ffffff; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__close { color: #9ca3af; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__close:hover { background: #252525; color: #ffffff; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__section-title { color: #9ca3af; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__info-row { background: #151515; border: 1px solid #2a2a2a; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__info-label { color: #9ca3af; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__info-value { color: #e5e5e5; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__entity-item { background: #151515; border: 1px solid #2a2a2a; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__entity-item:hover { background: #1f1f1f; border-color: #006fff; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__entity-name { color: #e5e5e5; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__entity-id { color: #9ca3af; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__state-badge--home,
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__state-badge--on { background: rgba(0, 168, 107, 0.15); color: #00d68f; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__state-badge--not_home,
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__state-badge--off { background: rgba(239, 68, 68, 0.15); color: #f87171; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__state-badge--default { background: #1f1f1f; color: #9ca3af; }

  /* UniFi Dark theme context menu */
  .context-menu[data-theme="unifi-dark"] { background: #1a1a1a; border: 1px solid #2a2a2a; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
  .context-menu[data-theme="unifi-dark"] .context-menu__header { border-bottom: 1px solid #2a2a2a; }
  .context-menu[data-theme="unifi-dark"] .context-menu__title { color: #ffffff; }
  .context-menu[data-theme="unifi-dark"] .context-menu__type { color: #9ca3af; }
  .context-menu[data-theme="unifi-dark"] .context-menu__item { color: #e5e5e5; }
  .context-menu[data-theme="unifi-dark"] .context-menu__item:hover { background: rgba(0, 111, 255, 0.15); color: #3b9eff; }
  .context-menu[data-theme="unifi-dark"] .context-menu__item--danger:hover { background: rgba(239, 68, 68, 0.15); color: #f87171; }
  .context-menu[data-theme="unifi-dark"] .context-menu__divider { background: #2a2a2a; }
`;
var GLOBAL_STYLES = `
  .unifi-icon { display: inline-flex; align-items: center; justify-content: center; line-height: 1; }
  .unifi-icon svg { width: 1em; height: 1em; stroke: currentColor; fill: none; }

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
    overflow-x: hidden;
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
    padding-bottom: 28px;
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
    overflow: hidden;
    max-width: 100%;
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
    overflow: hidden;
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
    max-width: 100px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

  /* UniFi theme entity modal (global) */
  .entity-modal-overlay[data-theme="unifi"] .entity-modal { background: #ffffff; border: 1px solid #e5e7eb; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__header { background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__title { color: #1a1a1a; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__close { color: #6b7280; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__close:hover { background: #f3f4f6; color: #1a1a1a; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__section-title { color: #6b7280; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__info-row { background: #f9fafb; border: 1px solid #e5e7eb; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__info-label { color: #6b7280; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__info-value { color: #1a1a1a; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__entity-item { background: #f9fafb; border: 1px solid #e5e7eb; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__entity-item:hover { background: #f3f4f6; border-color: #006fff; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__entity-name { color: #1a1a1a; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__entity-id { color: #6b7280; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__state-badge--home,
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__state-badge--on { background: rgba(0, 168, 107, 0.1); color: #00a86b; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__state-badge--not_home,
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__state-badge--off { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__state-badge--default { background: #f3f4f6; color: #6b7280; }

  /* UniFi theme context menu (global) */
  .context-menu[data-theme="unifi"] { background: #ffffff; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
  .context-menu[data-theme="unifi"] .context-menu__header { border-bottom: 1px solid #e5e7eb; }
  .context-menu[data-theme="unifi"] .context-menu__title { color: #1a1a1a; }
  .context-menu[data-theme="unifi"] .context-menu__type { color: #6b7280; }
  .context-menu[data-theme="unifi"] .context-menu__item { color: #374151; }
  .context-menu[data-theme="unifi"] .context-menu__item:hover { background: rgba(0, 111, 255, 0.1); color: #006fff; }
  .context-menu[data-theme="unifi"] .context-menu__item--danger:hover { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
  .context-menu[data-theme="unifi"] .context-menu__divider { background: #e5e7eb; }

  /* UniFi Dark theme entity modal (global) */
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal { background: #1a1a1a; border: 1px solid #2a2a2a; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__header { background: #151515; border-bottom: 1px solid #2a2a2a; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__title { color: #ffffff; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__close { color: #9ca3af; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__close:hover { background: #252525; color: #ffffff; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__section-title { color: #9ca3af; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__info-row { background: #151515; border: 1px solid #2a2a2a; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__info-label { color: #9ca3af; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__info-value { color: #e5e5e5; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__entity-item { background: #151515; border: 1px solid #2a2a2a; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__entity-item:hover { background: #1f1f1f; border-color: #006fff; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__entity-name { color: #e5e5e5; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__entity-id { color: #9ca3af; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__state-badge--home,
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__state-badge--on { background: rgba(0, 168, 107, 0.15); color: #00d68f; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__state-badge--not_home,
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__state-badge--off { background: rgba(239, 68, 68, 0.15); color: #f87171; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__state-badge--default { background: #1f1f1f; color: #9ca3af; }

  /* UniFi Dark theme context menu (global) */
  .context-menu[data-theme="unifi-dark"] { background: #1a1a1a; border: 1px solid #2a2a2a; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
  .context-menu[data-theme="unifi-dark"] .context-menu__header { border-bottom: 1px solid #2a2a2a; }
  .context-menu[data-theme="unifi-dark"] .context-menu__title { color: #ffffff; }
  .context-menu[data-theme="unifi-dark"] .context-menu__type { color: #9ca3af; }
  .context-menu[data-theme="unifi-dark"] .context-menu__item { color: #e5e5e5; }
  .context-menu[data-theme="unifi-dark"] .context-menu__item:hover { background: rgba(0, 111, 255, 0.15); color: #3b9eff; }
  .context-menu[data-theme="unifi-dark"] .context-menu__item--danger:hover { background: rgba(239, 68, 68, 0.15); color: #f87171; }
  .context-menu[data-theme="unifi-dark"] .context-menu__divider { background: #2a2a2a; }

  /* Toast feedback animation */
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
    15% { opacity: 1; transform: translateX(-50%) translateY(0); }
    85% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  }

  /* Port Modal Styles */
  .port-modal-overlay {
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
  .port-modal {
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
    border-radius: 16px;
    width: 90%;
    max-width: 520px;
    max-height: 85vh;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(148, 163, 184, 0.2);
  }
  .port-modal__header {
    padding: 20px 24px;
    background: rgba(148, 163, 184, 0.1);
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .port-modal__title {
    font-size: 18px;
    font-weight: 600;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .port-modal__icon { font-size: 20px; }
  .port-modal__close {
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 24px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 8px;
    transition: all 0.2s;
  }
  .port-modal__close:hover {
    background: rgba(148, 163, 184, 0.2);
    color: #f8fafc;
  }
  .port-modal__subtitle {
    padding: 12px 24px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
    background: rgba(0, 0, 0, 0.2);
  }
  .port-modal__body {
    padding: 16px 24px;
    overflow-y: auto;
    max-height: calc(85vh - 140px);
  }
  .port-list { display: flex; flex-direction: column; gap: 8px; }
  .port-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 10px;
    border: 1px solid rgba(148, 163, 184, 0.1);
  }
  .port-row--connected { }
  .port-row--empty { opacity: 0.5; }
  .port-row__number {
    font-weight: 600;
    font-size: 13px;
    color: #94a3b8;
    min-width: 60px;
  }
  .port-row__device {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .port-row__device-icon { font-size: 16px; flex-shrink: 0; }
  .port-row__device-name {
    color: #60a5fa;
    text-decoration: none;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .port-row__device-name:hover { text-decoration: underline; }
  .port-row__empty { color: #64748b; font-size: 13px; }
  .port-row__badges { display: flex; gap: 4px; flex-shrink: 0; }
  .port-modal__empty {
    text-align: center;
    color: #64748b;
    padding: 24px;
  }

  /* Port Modal - Light theme */
  .port-modal-overlay[data-theme="light"] .port-modal {
    background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
  }
  .port-modal-overlay[data-theme="light"] .port-modal__header {
    background: rgba(148, 163, 184, 0.15);
    border-bottom-color: rgba(148, 163, 184, 0.3);
  }
  .port-modal-overlay[data-theme="light"] .port-modal__title { color: #0f172a; }
  .port-modal-overlay[data-theme="light"] .port-modal__close { color: #64748b; }
  .port-modal-overlay[data-theme="light"] .port-modal__close:hover { background: rgba(15, 23, 42, 0.1); color: #0f172a; }
  .port-modal-overlay[data-theme="light"] .port-modal__subtitle { color: #475569; }
  .port-modal-overlay[data-theme="light"] .port-row { background: rgba(15, 23, 42, 0.04); }
  .port-modal-overlay[data-theme="light"] .port-row__number { color: #64748b; }
  .port-modal-overlay[data-theme="light"] .port-row__device-name { color: #1d4ed8; }
  .port-modal-overlay[data-theme="light"] .port-row__empty { color: #64748b; }

  /* Port Modal - UniFi theme */
  .port-modal-overlay[data-theme="unifi"] .port-modal { background: #ffffff; border: 1px solid #e5e7eb; }
  .port-modal-overlay[data-theme="unifi"] .port-modal__header { background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
  .port-modal-overlay[data-theme="unifi"] .port-modal__title { color: #1a1a1a; }
  .port-modal-overlay[data-theme="unifi"] .port-modal__close { color: #6b7280; }
  .port-modal-overlay[data-theme="unifi"] .port-modal__close:hover { background: #f3f4f6; color: #1a1a1a; }
  .port-modal-overlay[data-theme="unifi"] .port-modal__subtitle { color: #6b7280; background: #f9fafb; }
  .port-modal-overlay[data-theme="unifi"] .port-row { background: #f9fafb; border: 1px solid #e5e7eb; }
  .port-modal-overlay[data-theme="unifi"] .port-row__number { color: #6b7280; }
  .port-modal-overlay[data-theme="unifi"] .port-row__device-name { color: #006fff; }
  .port-modal-overlay[data-theme="unifi"] .port-row__empty { color: #6b7280; }

  /* Port Modal - UniFi Dark theme */
  .port-modal-overlay[data-theme="unifi-dark"] .port-modal { background: #1a1a1a; border: 1px solid #2a2a2a; }
  .port-modal-overlay[data-theme="unifi-dark"] .port-modal__header { background: #151515; border-bottom: 1px solid #2a2a2a; }
  .port-modal-overlay[data-theme="unifi-dark"] .port-modal__title { color: #ffffff; }
  .port-modal-overlay[data-theme="unifi-dark"] .port-modal__close { color: #9ca3af; }
  .port-modal-overlay[data-theme="unifi-dark"] .port-modal__close:hover { background: #252525; color: #ffffff; }
  .port-modal-overlay[data-theme="unifi-dark"] .port-modal__subtitle { color: #9ca3af; background: #151515; }
  .port-modal-overlay[data-theme="unifi-dark"] .port-row { background: #151515; border: 1px solid #2a2a2a; }
  .port-modal-overlay[data-theme="unifi-dark"] .port-row__number { color: #9ca3af; }
  .port-modal-overlay[data-theme="unifi-dark"] .port-row__device-name { color: #3b9eff; }
  .port-modal-overlay[data-theme="unifi-dark"] .port-row__empty { color: #9ca3af; }
`;

// src/card/ui/vlan-colors.ts
var VLAN_PALETTE = {
  dark: [
    "#60a5fa",
    // Blue
    "#4ade80",
    // Green
    "#fbbf24",
    // Amber
    "#f87171",
    // Red
    "#a78bfa",
    // Violet
    "#f472b6",
    // Pink
    "#22d3ee",
    // Cyan
    "#a3e635",
    // Lime
    "#fb923c",
    // Orange
    "#818cf8"
    // Indigo
  ],
  light: [
    "#2563eb",
    // Blue
    "#16a34a",
    // Green
    "#d97706",
    // Amber
    "#dc2626",
    // Red
    "#7c3aed",
    // Violet
    "#db2777",
    // Pink
    "#0891b2",
    // Cyan
    "#65a30d",
    // Lime
    "#ea580c",
    // Orange
    "#4f46e5"
    // Indigo
  ]
};
function isLightTheme(theme) {
  return theme === "light" || theme === "unifi";
}
function assignVlanColors(vlanInfo, theme) {
  if (!vlanInfo) {
    return {};
  }
  const palette = isLightTheme(theme) ? VLAN_PALETTE.light : VLAN_PALETTE.dark;
  const vlanIds = Object.keys(vlanInfo).map(Number).sort((a, b) => a - b);
  const colorMap = {};
  for (let i = 0; i < vlanIds.length; i++) {
    const vlanId = vlanIds[i];
    colorMap[vlanId] = palette[i % palette.length];
  }
  return colorMap;
}
function generateVlanStyles(nodeVlans, colorMap) {
  if (!nodeVlans || Object.keys(colorMap).length === 0) {
    return "";
  }
  const rules = [];
  for (const [nodeName, vlanId] of Object.entries(nodeVlans)) {
    if (vlanId === null || !(vlanId in colorMap)) {
      continue;
    }
    const color = colorMap[vlanId];
    const escapedName = CSS.escape(nodeName);
    rules.push(`
      .unifi-network-map__viewport svg [data-node-id="${escapedName}"] > rect,
      .unifi-network-map__viewport svg [data-node-id="${escapedName}"] > circle,
      .unifi-network-map__viewport svg [data-node-id="${escapedName}"] > polygon,
      .unifi-network-map__viewport svg [data-node-id="${escapedName}"] > ellipse,
      .unifi-network-map__viewport svg [data-node-id="${escapedName}"] > path:not([data-edge]) {
        stroke: ${color};
        stroke-width: 2px;
      }
    `);
  }
  return rules.join("\n");
}

// src/card/core/unifi-network-map-card.ts
function normalizeCardHeight(value) {
  if (value === void 0 || value === null) return null;
  const raw = typeof value === "number" ? `${value}` : value.trim();
  if (!raw) return null;
  if (/^\d+(\.\d+)?$/.test(raw)) {
    return `${raw}px`;
  }
  return raw;
}
function parseCardHeightPx(value) {
  if (value === void 0 || value === null) return null;
  if (typeof value === "number") return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d+(?:\.\d+)?)px$/);
  if (match) {
    return Number.parseFloat(match[1]);
  }
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return Number.parseFloat(trimmed);
  }
  return null;
}
var UnifiNetworkMapCard = class extends HTMLElement {
  constructor() {
    super(...arguments);
    this._loading = false;
    this._dataLoading = false;
    this._localize = createLocalize();
    this._showLoadingOverlay = false;
    this._viewportState = createDefaultViewportState();
    this._selection = createSelectionState();
    this._activeTab = "overview";
    this._entityModal = createEntityModalController();
    this._contextMenu = createContextMenuController();
    this._portModal = createPortModalController();
    this._filterState = createFilterState();
    this._wsSubscribed = false;
    this._wsSubscriptionVersion = 0;
    this._svgRequestId = 0;
    this._payloadRequestId = 0;
    this._annotationCache = createAnnotationCache();
  }
  static getLayoutOptions() {
    return { grid_columns: 4, grid_rows: 3, grid_min_columns: 2, grid_min_rows: 2 };
  }
  getCardSize() {
    const heightPx = parseCardHeightPx(this._config?.card_height);
    if (heightPx) {
      return Math.max(1, Math.ceil(heightPx / 50));
    }
    return 4;
  }
  static getConfigElement() {
    return document.createElement("unifi-network-map-editor");
  }
  static getStubConfig() {
    return { entry_id: "", theme: "unifi" };
  }
  setConfig(config) {
    const prevEntryId = this._config?.entry_id;
    this._config = normalizeConfig(config);
    const nextEntryId = this._config?.entry_id;
    const entryChanged = prevEntryId !== nextEntryId;
    if (entryChanged) {
      this._stopWebSocketSubscription();
      this._stopStatusPolling();
      this._payload = void 0;
      this._lastDataUrl = void 0;
      if (this.isConnected) {
        void this._startWebSocketSubscription();
      }
    }
    this._render();
  }
  set hass(hass) {
    const hadHass = this._hass !== void 0;
    const prevToken = this._hass?.auth?.data?.access_token;
    const newToken = hass?.auth?.data?.access_token;
    this._hass = hass;
    this._localize = createLocalize(hass);
    if (!hadHass || prevToken !== newToken) {
      this._render();
    }
  }
  connectedCallback() {
    this._render();
    this._startWebSocketSubscription();
  }
  disconnectedCallback() {
    this._stopWebSocketSubscription();
    this._stopStatusPolling();
    this._clearLoadingOverlay();
    this._removeEntityModal();
    this._removeContextMenu();
    this._removePortModal();
  }
  _startStatusPolling() {
    if (this._wsSubscribed) {
      return;
    }
    this._statusPollInterval = startPolling(this._statusPollInterval, 3e4, () => {
      this._refreshPayload();
    });
  }
  _stopStatusPolling() {
    this._statusPollInterval = stopPolling(this._statusPollInterval);
  }
  async _startWebSocketSubscription() {
    if (!this._config?.entry_id || !this._hass) {
      this._startStatusPolling();
      return;
    }
    const entryId = this._config.entry_id;
    const subscriptionVersion = ++this._wsSubscriptionVersion;
    const result = await subscribeMapUpdates(this._hass, entryId, (payload) => {
      this._payload = payload;
      this._lastDataUrl = this._config?.data_url;
      this._render();
    });
    if (subscriptionVersion !== this._wsSubscriptionVersion || entryId !== this._config?.entry_id) {
      if (result.subscribed) {
        result.unsubscribe();
      }
      return;
    }
    if (result.subscribed) {
      this._wsSubscribed = true;
      this._wsUnsubscribe = result.unsubscribe;
      this._stopStatusPolling();
    } else {
      this._wsSubscribed = false;
      this._startStatusPolling();
    }
  }
  _stopWebSocketSubscription() {
    this._wsSubscriptionVersion += 1;
    if (this._wsUnsubscribe) {
      this._wsUnsubscribe();
      this._wsUnsubscribe = void 0;
    }
    this._wsSubscribed = false;
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
    const svgTheme = this._config?.svg_theme ?? "unifi";
    if (!this._config) {
      this._renderMissingConfig(theme, svgTheme);
      return;
    }
    if (!this._config.svg_url) {
      this._renderPreviewCard(theme, svgTheme);
      return;
    }
    const token = this._getAuthToken();
    this._clearMissingAuthError(token);
    this._setCardBody(this._renderBody(), theme, svgTheme);
    if (!this._canFinishRender(token)) {
      return;
    }
    this._finalizeRender();
  }
  _setCardBody(body, theme, svgTheme) {
    const card = document.createElement("ha-card");
    card.dataset.theme = theme;
    card.dataset.svgTheme = svgTheme;
    this._applyCardHeight(card);
    card.innerHTML = sanitizeHtml(body);
    this.replaceChildren(card);
  }
  _renderMissingConfig(theme, svgTheme) {
    this._setCardBody(
      `<div style="padding:16px;">${this._localize("card.error.missing_config")}</div>`,
      theme,
      svgTheme
    );
  }
  _renderPreviewCard(theme, svgTheme) {
    this._setCardBody(this._renderPreview(), theme, svgTheme);
  }
  _clearMissingAuthError(token) {
    if (token && this._error === "Missing auth token") {
      this._error = void 0;
    }
  }
  _renderBody() {
    if (this._error) {
      return this._renderError();
    }
    if (this._svgContent) {
      return this._renderLayout();
    }
    return this._renderLoading();
  }
  _canFinishRender(token) {
    return !(!token && this._error === "Missing auth token");
  }
  _finalizeRender() {
    this._ensureStyles();
    this._wireRetry();
    this._loadSvg();
    this._loadPayload();
    this._wireInteractions();
  }
  _applyCardHeight(card) {
    if (this.closest("hui-card-edit-mode")) {
      this.style.height = "100%";
      card.style.height = "100%";
      return;
    }
    const height = normalizeCardHeight(this._config?.card_height);
    if (!height) {
      card.style.removeProperty("height");
      return;
    }
    card.style.height = height;
  }
  async _loadSvg() {
    if (!this._shouldLoadSvg()) {
      return;
    }
    if (!this._ensureAuthForSvg()) {
      return;
    }
    const request = this._beginSvgRequest();
    if (!request) {
      return;
    }
    this._prepareSvgLoadingOverlay(request.isRefresh);
    const result = await loadSvg(
      this._fetchWithAuth.bind(this),
      request.url,
      request.controller.signal
    );
    if (!this._isActiveSvgRequest(request.id, result)) {
      return;
    }
    this._finalizeSvgRequest(result, request.url);
  }
  async _loadPayload() {
    if (!this._shouldLoadPayload()) {
      return;
    }
    const request = this._beginPayloadRequest();
    if (!request) {
      return;
    }
    this._preparePayloadLoadingOverlay(request.isRefresh);
    const result = await loadPayload(
      this._fetchWithAuth.bind(this),
      request.url,
      request.controller.signal
    );
    if (!this._isActivePayloadRequest(request.id, result)) {
      return;
    }
    this._finalizePayloadRequest(result, request.url);
  }
  _scheduleLoadingOverlay() {
    if (this._loadingOverlayTimeout) return;
    this._loadingOverlayTimeout = setTimeout(() => {
      if (this._isLoading()) {
        this._showLoadingOverlay = true;
        this._render();
      }
    }, 2e3);
  }
  _clearLoadingOverlay() {
    if (this._loadingOverlayTimeout) {
      clearTimeout(this._loadingOverlayTimeout);
      this._loadingOverlayTimeout = void 0;
    }
    if (!this._isLoading()) {
      this._showLoadingOverlay = false;
    }
  }
  _shouldLoadSvg() {
    if (!this._config?.svg_url || !this._hass) {
      return false;
    }
    return !(this._loading || this._config.svg_url === this._lastSvgUrl);
  }
  _ensureAuthForSvg() {
    if (this._getAuthToken()) {
      return true;
    }
    this._error = "Missing auth token";
    this._render();
    return false;
  }
  _beginSvgRequest() {
    const url = this._config?.svg_url;
    if (!url) {
      return null;
    }
    this._svgAbortController?.abort();
    const controller = new AbortController();
    this._svgAbortController = controller;
    this._loading = true;
    return { id: ++this._svgRequestId, url, controller, isRefresh: !!this._svgContent };
  }
  _prepareSvgLoadingOverlay(isRefresh) {
    if (!isRefresh) {
      this._showLoadingOverlay = true;
      this._render();
      return;
    }
    this._scheduleLoadingOverlay();
  }
  _isActiveSvgRequest(requestId, result) {
    if (requestId !== this._svgRequestId) {
      return false;
    }
    return !("aborted" in result);
  }
  _finalizeSvgRequest(result, url) {
    if ("error" in result && result.error) {
      this._error = `Failed to load SVG (${result.error})`;
    } else if ("data" in result) {
      this._svgContent = result.data.svg ?? "";
      this._themeBackground = result.data.background ?? void 0;
      this._error = void 0;
      invalidateAnnotationCache(this._annotationCache);
    }
    this._lastSvgUrl = url;
    this._loading = false;
    this._clearLoadingOverlay();
    this._render();
  }
  _shouldLoadPayload() {
    if (!this._config?.data_url || !this._hass) {
      return false;
    }
    if (this._dataLoading || this._config.data_url === this._lastDataUrl) {
      return false;
    }
    return !!this._getAuthToken();
  }
  _beginPayloadRequest() {
    const url = this._config?.data_url;
    if (!url) {
      return null;
    }
    this._payloadAbortController?.abort();
    const controller = new AbortController();
    this._payloadAbortController = controller;
    this._dataLoading = true;
    return { id: ++this._payloadRequestId, url, controller, isRefresh: !!this._payload };
  }
  _preparePayloadLoadingOverlay(isRefresh) {
    if (!isRefresh) {
      this._scheduleLoadingOverlay();
    }
  }
  _isActivePayloadRequest(requestId, result) {
    if (requestId !== this._payloadRequestId) {
      return false;
    }
    return !("aborted" in result);
  }
  _finalizePayloadRequest(result, url) {
    if ("error" in result && result.error) {
      this._error = `Failed to load payload (${result.error})`;
    } else if ("data" in result) {
      this._payload = result.data;
      invalidateAnnotationCache(this._annotationCache);
    }
    this._lastDataUrl = url;
    this._dataLoading = false;
    this._clearLoadingOverlay();
    this._render();
  }
  _renderPreview() {
    return `
      <div class="unifi-network-map__preview">
        <img src="/unifi-network-map/card-preview.svg" alt="${this._localize("card.preview.alt")}" />
      </div>
    `;
  }
  _renderLoading() {
    return `
      <div class="unifi-network-map__loading">
        <div class="unifi-network-map__spinner" role="progressbar" aria-label="${this._localize("card.loading.aria")}"></div>
        <div class="unifi-network-map__loading-text">${this._localize("card.loading.map")}</div>
      </div>
    `;
  }
  _renderError() {
    return `
      <div class="unifi-network-map__error">
        <div class="unifi-network-map__error-text">${escapeHtml(this._formatErrorMessage(this._error))}</div>
        <button type="button" class="unifi-network-map__retry" data-action="retry">${this._localize("card.error.retry")}</button>
      </div>
    `;
  }
  _formatErrorMessage(error) {
    if (!error) {
      return this._localize("card.error.unknown");
    }
    if (error === "Missing auth token") {
      return this._localize("card.error.missing_auth");
    }
    const svgMatch = error.match(/^Failed to load SVG \((.+)\)$/);
    if (svgMatch) {
      return this._localize("card.error.load_svg", { error: svgMatch[1] });
    }
    const payloadMatch = error.match(/^Failed to load payload \((.+)\)$/);
    if (payloadMatch) {
      return this._localize("card.error.load_payload", { error: payloadMatch[1] });
    }
    return error;
  }
  _renderLayout() {
    const safeSvg = this._svgContent ? sanitizeSvg(this._svgContent) : "";
    const viewportStyle = this._themeBackground ? `background: ${this._themeBackground}` : "";
    return `
      <div class="unifi-network-map__layout">
        <div class="unifi-network-map__viewport" style="${viewportStyle}">
          <div class="unifi-network-map__controls">
            <button type="button" data-action="zoom-in" title="${this._localize("card.controls.zoom_in")}">+</button>
            <button type="button" data-action="zoom-out" title="${this._localize("card.controls.zoom_out")}">-</button>
            <button type="button" data-action="reset" title="${this._localize("card.controls.reset_view")}">${this._localize("card.controls.reset")}</button>
          </div>
          ${this._renderLoadingOverlay()}
          ${safeSvg}
          <div class="unifi-network-map__status-layer"></div>
          <div class="unifi-network-map__tooltip" hidden></div>
          <div class="filter-bar-container"></div>
        </div>
        <div class="unifi-network-map__panel">
          ${this._renderPanelContent()}
        </div>
      </div>
    `;
  }
  _injectFilterBar(viewport) {
    const container = viewport.querySelector(".filter-bar-container");
    if (!container) return;
    const nodeTypes = this._payload?.node_types ?? {};
    const counts = countDeviceTypes(nodeTypes);
    const theme = this._config?.theme ?? "dark";
    const labels = this._getFilterLabels();
    const filterBar = this._getFilterBar(container);
    for (const type of this._filterDeviceTypes()) {
      const button = this._getFilterButton(filterBar, type);
      this._updateFilterButton(button, {
        type,
        count: counts[type] ?? 0,
        theme,
        label: labels[type]
      });
    }
  }
  _renderLoadingOverlay() {
    if (!this._showLoadingOverlay || !this._isLoading()) {
      return "";
    }
    return `
      <div class="unifi-network-map__loading-overlay">
        <div class="unifi-network-map__spinner"></div>
        <div class="unifi-network-map__loading-text">${this._localize("card.loading.refresh")}</div>
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
    this._showLoadingOverlay = true;
    this._loadSvg();
    this._loadPayload();
    this._render();
  }
  _updateSelectionOnly() {
    const panel = this.querySelector(".unifi-network-map__panel");
    if (panel) {
      panel.innerHTML = sanitizeHtml(this._renderPanelContent());
      panel.onclick = (event) => this._onPanelClick(event);
    }
    const svg3 = this.querySelector(".unifi-network-map__viewport svg");
    if (svg3) {
      this._highlightSelectedNode(svg3);
    }
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
    const theme = this._config?.theme ?? "dark";
    return {
      escapeHtml,
      getNodeTypeIcon: (nodeType) => this._getNodeTypeIcon(nodeType),
      getIcon: (name) => this._getIcon(name),
      getDomainIcon: (domain) => domainIcon(domain, theme),
      getStatusBadgeHtml: (state) => this._getStatusBadgeHtml(state),
      formatLastChanged: (value) => this._formatLastChanged(value),
      localize: this._localize
    };
  }
  _filterDeviceTypes() {
    return ["gateway", "switch", "ap", "client", "other"];
  }
  _getFilterLabels() {
    return {
      gateway: this._localize("panel.device_type.gateways"),
      switch: this._localize("panel.device_type.switches"),
      ap: this._localize("panel.device_type.access_points"),
      client: this._localize("panel.device_type.clients"),
      other: this._localize("panel.device_type.other")
    };
  }
  _getFilterBar(container) {
    let filterBar = container.querySelector(".filter-bar");
    if (!filterBar) {
      filterBar = document.createElement("div");
      filterBar.className = "filter-bar";
      container.appendChild(filterBar);
    }
    return filterBar;
  }
  _getFilterButton(filterBar, type) {
    let button = filterBar.querySelector(
      `button[data-filter-type="${type}"]`
    );
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.dataset.filterType = type;
      button.innerHTML = `<span class="filter-button__icon"></span><span class="filter-button__count"></span>`;
      button.onclick = (event) => this._onFilterButtonClick(event, type);
      filterBar.appendChild(button);
    }
    return button;
  }
  _onFilterButtonClick(event, type) {
    event.preventDefault();
    event.stopPropagation();
    this._filterState = toggleFilter(this._filterState, type);
    this._updateFilterDisplay();
  }
  _updateFilterButton(button, data) {
    const active = this._filterState[data.type];
    const titleKey = active ? "card.filter.hide" : "card.filter.show";
    const icon = nodeTypeIcon(data.type, data.theme);
    button.className = `filter-button ${active ? "filter-button--active" : "filter-button--inactive"}`;
    button.title = this._localize(titleKey, { label: data.label });
    const iconSpan = button.querySelector(".filter-button__icon");
    if (iconSpan) {
      iconSpan.innerHTML = icon;
    }
    const countSpan = button.querySelector(".filter-button__count");
    if (countSpan) {
      countSpan.textContent = String(data.count);
    }
  }
  _getNodeTypeIcon(nodeType) {
    const theme = this._config?.theme ?? "dark";
    return nodeTypeIcon(nodeType, theme);
  }
  _getIcon(name) {
    const theme = this._config?.theme ?? "dark";
    return iconMarkup(name, theme);
  }
  _getStatusBadgeHtml(state) {
    const labels = {
      online: this._localize("panel.status.online"),
      offline: this._localize("panel.status.offline"),
      unknown: this._localize("panel.status.unknown")
    };
    return `<span class="status-badge status-badge--${state}">${labels[state]}</span>`;
  }
  _formatLastChanged(isoString) {
    if (!isoString) return this._localize("card.time.unknown");
    try {
      const date = new Date(isoString);
      const now = /* @__PURE__ */ new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 6e4);
      if (diffMin < 1) return this._localize("card.time.just_now");
      if (diffMin < 60) return this._localize("card.time.minutes_ago", { count: diffMin });
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return this._localize("card.time.hours_ago", { count: diffHours });
      const diffDays = Math.floor(diffHours / 24);
      return this._localize("card.time.days_ago", { count: diffDays });
    } catch {
      return this._localize("card.time.unknown");
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
  _applyVlanColors() {
    this._removeVlanStyles();
    if (!this._payload?.node_vlans || !this._payload?.vlan_info) {
      return;
    }
    const theme = this._config?.theme ?? "dark";
    const colorMap = assignVlanColors(this._payload.vlan_info, theme);
    const css = generateVlanStyles(this._payload.node_vlans, colorMap);
    if (!css) {
      return;
    }
    const style = document.createElement("style");
    style.dataset.unifiNetworkMapVlan = "true";
    style.textContent = css;
    this.appendChild(style);
  }
  _removeVlanStyles() {
    const existing = this.querySelector("style[data-unifi-network-map-vlan]");
    if (existing) {
      existing.remove();
    }
  }
  _wireInteractions() {
    const viewport = this.querySelector(".unifi-network-map__viewport");
    const svg3 = viewport?.querySelector("svg");
    const tooltip = viewport?.querySelector(".unifi-network-map__tooltip");
    const panel = this.querySelector(".unifi-network-map__panel");
    if (!viewport || !svg3 || !tooltip) {
      return;
    }
    this._ensureStyles();
    applyTransform(svg3, this._viewportState.viewTransform, this._viewportState.isPanning);
    this._annotateIfNeeded(svg3);
    this._highlightSelectedNode(svg3);
    this._wireControls(svg3);
    this._bindViewport(viewport, svg3, tooltip);
    this._applyVlanColors();
    this._injectFilterBar(viewport);
    this._applyFilters(svg3);
    if (panel) {
      panel.onclick = (event) => this._onPanelClick(event);
    }
  }
  _annotateIfNeeded(svg3) {
    const cacheKey = buildCacheKey(
      this._svgContent ?? "",
      this._payload?.node_types,
      this._payload?.edges
    );
    if (shouldSkipAnnotations(this._annotationCache, cacheKey)) {
      return;
    }
    annotateNodeIds(svg3, Object.keys(this._payload?.node_types ?? {}));
    removeSvgTitles(svg3);
    this._annotateEdges(svg3);
    markAnnotationsComplete(this._annotationCache, cacheKey);
  }
  _bindViewport(viewport, svg3, tooltip) {
    const options = this._viewportOptions();
    const callbacks = this._viewportCallbacks();
    bindViewportInteractions({
      viewport,
      svg: svg3,
      state: this._viewportState,
      options,
      handlers: createDefaultViewportHandlers(
        this._payload?.edges,
        (name) => this._getIcon(name),
        this._localize
      ),
      callbacks,
      bindings: {
        tooltip,
        controls: viewport.querySelector(".unifi-network-map__controls")
      }
    });
  }
  _updateFilterDisplay() {
    const viewport = this.querySelector(".unifi-network-map__viewport");
    const svg3 = viewport?.querySelector("svg");
    if (svg3) {
      this._applyFilters(svg3);
    }
    if (viewport) {
      this._injectFilterBar(viewport);
    }
  }
  _applyFilters(svg3) {
    const nodeTypes = this._payload?.node_types ?? {};
    const hiddenNodes = /* @__PURE__ */ new Set();
    for (const [nodeName, nodeType] of Object.entries(nodeTypes)) {
      const normalized = normalizeDeviceType(nodeType);
      const visible = this._filterState[normalized];
      const element = findNodeElement(svg3, nodeName);
      if (element) {
        element.classList.toggle("node--filtered", !visible);
        if (!visible) {
          hiddenNodes.add(nodeName);
        }
      }
    }
    this._applyEdgeFilters(svg3, hiddenNodes);
  }
  _applyEdgeFilters(svg3, hiddenNodes) {
    const edgePaths = svg3.querySelectorAll("path[data-edge-left][data-edge-right]");
    const filteredEdges = /* @__PURE__ */ new Set();
    for (const path of edgePaths) {
      const left = path.getAttribute("data-edge-left");
      const right = path.getAttribute("data-edge-right");
      if (!left || !right) continue;
      const shouldHide = hiddenNodes.has(left) || hiddenNodes.has(right);
      path.classList.toggle("edge--filtered", shouldHide);
      if (shouldHide) {
        filteredEdges.add(this._edgeKey(left, right));
      }
      const hitbox = path.nextElementSibling;
      if (hitbox?.getAttribute("data-edge-hitbox")) {
        hitbox.classList.toggle("edge--filtered", shouldHide);
      }
    }
    this._applyEdgeLabelFilters(svg3, filteredEdges);
  }
  _edgeKey(left, right) {
    return [left.trim(), right.trim()].sort().join("|");
  }
  _applyEdgeLabelFilters(svg3, filteredEdges) {
    const labeledElements = svg3.querySelectorAll("[data-edge-left][data-edge-right]:not(path)");
    for (const el of labeledElements) {
      const left = el.getAttribute("data-edge-left");
      const right = el.getAttribute("data-edge-right");
      if (!left || !right) continue;
      const shouldHide = filteredEdges.has(this._edgeKey(left, right));
      el.classList.toggle("edge--filtered", shouldHide);
    }
    const edgeLabels = svg3.querySelectorAll(".edgeLabel");
    for (const label of edgeLabels) {
      const left = label.getAttribute("data-edge-left");
      const right = label.getAttribute("data-edge-right");
      if (left && right) {
        const shouldHide = filteredEdges.has(this._edgeKey(left, right));
        label.classList.toggle("edge--filtered", shouldHide);
      }
    }
  }
  _onPanelClick(event) {
    const target = event.target;
    if (this._handleTabClick(target, event)) return;
    if (this._handleBackClick(target, event)) return;
    if (this._handleCopyClick(target, event)) return;
    if (this._handleNavigateDeviceClick(target, event)) return;
    if (this._handleViewPortsClick(target, event)) return;
    this._handleEntityClick(target, event);
  }
  _handleViewPortsClick(target, event) {
    const button = target.closest('[data-action="view-ports"]');
    if (!button) return false;
    event.preventDefault();
    const nodeName = button.getAttribute("data-node-name");
    if (nodeName) {
      this._showPortModal(nodeName);
    }
    return true;
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
          textEl.textContent = this._localize("toast.copied");
          setTimeout(() => {
            textEl.textContent = original;
          }, 1500);
        }
      });
    }
    return true;
  }
  _handleNavigateDeviceClick(target, event) {
    const link = target.closest("[data-navigate-device]");
    if (!link) return false;
    event.preventDefault();
    const deviceName = link.getAttribute("data-navigate-device");
    if (deviceName) {
      this._navigateToDevice(deviceName);
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
      localize: this._localize,
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
      onAction: (action, nodeName, mac, ip) => this._handleContextMenuAction(action, nodeName, mac, ip)
    });
  }
  _renderContextMenu(nodeName) {
    return renderContextMenu({
      nodeName,
      payload: this._payload,
      theme: this._config?.theme ?? "dark",
      getNodeTypeIcon: (nodeType) => this._getNodeTypeIcon(nodeType),
      getIcon: (name) => this._getIcon(name),
      localize: this._localize
    });
  }
  _handleContextMenuAction(action, nodeName, mac, ip) {
    switch (action) {
      case "details":
        this._removeContextMenu();
        this._showEntityModal(nodeName);
        break;
      case "copy-mac":
        if (mac) {
          navigator.clipboard.writeText(mac).then(() => {
            this._showCopyFeedback(this._localize("toast.copy_mac"));
          });
        }
        this._removeContextMenu();
        break;
      case "copy-ip":
        if (ip) {
          navigator.clipboard.writeText(ip).then(() => {
            this._showCopyFeedback(this._localize("toast.copy_ip"));
          });
        }
        this._removeContextMenu();
        break;
      case "restart":
        this._handleRestartDevice(nodeName);
        this._removeContextMenu();
        break;
      case "view-ports":
        this._removeContextMenu();
        this._showPortModal(nodeName);
        break;
      default:
        this._removeContextMenu();
    }
  }
  _showPortModal(nodeName) {
    openPortModal({
      controller: this._portModal,
      nodeName,
      payload: this._payload,
      theme: this._config?.theme ?? "dark",
      getNodeTypeIcon: (nodeType) => this._getNodeTypeIcon(nodeType),
      localize: this._localize,
      onClose: () => this._removePortModal(),
      onDeviceClick: (deviceName) => {
        this._removePortModal();
        this._navigateToDevice(deviceName);
      }
    });
  }
  _navigateToDevice(deviceName) {
    const nodeType = this._payload?.node_types?.[deviceName];
    if (nodeType) {
      const deviceType = normalizeDeviceType(nodeType);
      const newFilterState = enableFilter(this._filterState, deviceType);
      if (newFilterState !== this._filterState) {
        this._filterState = newFilterState;
        this._updateFilterDisplay();
      }
    }
    selectNode(this._selection, deviceName);
    this._render();
  }
  _removePortModal() {
    closePortModal(this._portModal);
  }
  _showCopyFeedback(message) {
    showToast(message, "success");
  }
  _handleRestartDevice(nodeName) {
    const entityId = this._payload?.node_entities?.[nodeName] ?? this._payload?.device_entities?.[nodeName];
    if (!entityId) {
      this._showActionError(this._localize("toast.no_entity"));
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
    this._showActionFeedback(this._localize("toast.restart_sent"));
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
  _wireControls(svg3) {
    const zoomIn = this.querySelector('[data-action="zoom-in"]');
    const zoomOut = this.querySelector('[data-action="zoom-out"]');
    const reset = this.querySelector('[data-action="reset"]');
    const options = this._viewportOptions();
    const callbacks = this._viewportCallbacks();
    if (zoomIn) {
      zoomIn.onclick = (event) => {
        event.preventDefault();
        applyZoom(svg3, ZOOM_INCREMENT, this._viewportState, options, callbacks);
      };
    }
    if (zoomOut) {
      zoomOut.onclick = (event) => {
        event.preventDefault();
        applyZoom(svg3, -ZOOM_INCREMENT, this._viewportState, options, callbacks);
      };
    }
    if (reset) {
      reset.onclick = (event) => {
        event.preventDefault();
        resetPan(svg3, this._viewportState, callbacks);
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
        this._updateSelectionOnly();
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
  _applyTransform(svg3) {
    applyTransform(svg3, this._viewportState.viewTransform, this._viewportState.isPanning);
  }
  _applyZoom(delta, svg3) {
    applyZoom(svg3, delta, this._viewportState, this._viewportOptions(), this._viewportCallbacks());
  }
  _onWheel(event, svg3) {
    onWheel(event, svg3, this._viewportState, this._viewportOptions(), this._viewportCallbacks());
  }
  _onPointerDown(event) {
    const controls = this.querySelector(".unifi-network-map__controls");
    onPointerDown(event, this._viewportState, controls);
  }
  _onPointerMove(event, svg3, tooltip) {
    onPointerMove(
      event,
      svg3,
      this._viewportState,
      this._viewportOptions(),
      createDefaultViewportHandlers(
        this._payload?.edges,
        (name) => this._getIcon(name),
        this._localize
      ),
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
  _findNodeElement(svg3, nodeName) {
    return findNodeElement(svg3, nodeName);
  }
  _highlightSelectedNode(svg3) {
    highlightSelectedNode(svg3, this._selection.selectedNode);
  }
  _clearNodeSelection(svg3) {
    clearNodeSelection(svg3);
  }
  _markNodeSelected(element) {
    markNodeSelected(element);
  }
  _annotateEdges(svg3) {
    if (!this._payload?.edges) return;
    annotateEdges(svg3, this._payload.edges);
  }
  _renderEdgeTooltip(edge) {
    return renderEdgeTooltip(edge, (name) => this._getIcon(name), this._localize);
  }
  _isControlTarget(target) {
    return Boolean(target?.closest(".unifi-network-map__controls"));
  }
};

// src/card/shared/editor-helpers.ts
function buildFormSchema(entries2, localize) {
  const entryOptions = entries2.map((entry) => ({
    label: entry.title,
    value: entry.entry_id
  }));
  return [
    {
      name: "entry_id",
      required: true,
      selector: { select: { mode: "dropdown", options: entryOptions } },
      label: localize("editor.entry_id")
    },
    {
      name: "theme",
      selector: {
        select: {
          mode: "dropdown",
          options: [
            { label: localize("editor.theme.dark"), value: "dark" },
            { label: localize("editor.theme.light"), value: "light" },
            { label: localize("editor.theme.unifi"), value: "unifi" },
            { label: localize("editor.theme.unifi_dark"), value: "unifi-dark" }
          ]
        }
      },
      label: localize("editor.theme")
    },
    {
      name: "svg_theme",
      selector: {
        select: {
          mode: "dropdown",
          options: [
            { label: localize("editor.svg_theme.unifi"), value: "unifi" },
            { label: localize("editor.svg_theme.unifi_dark"), value: "unifi-dark" },
            { label: localize("editor.svg_theme.minimal"), value: "minimal" },
            { label: localize("editor.svg_theme.minimal_dark"), value: "minimal-dark" },
            { label: localize("editor.svg_theme.classic"), value: "classic" },
            { label: localize("editor.svg_theme.classic_dark"), value: "classic-dark" }
          ]
        }
      },
      label: localize("editor.svg_theme")
    },
    {
      name: "icon_set",
      selector: {
        select: {
          mode: "dropdown",
          options: [
            { label: localize("editor.icon_set.modern"), value: "modern" },
            { label: localize("editor.icon_set.isometric"), value: "isometric" }
          ]
        }
      },
      label: localize("editor.icon_set")
    },
    {
      name: "card_height",
      selector: {
        text: {
          type: "text",
          suffix: "px"
        }
      },
      label: localize("editor.card_height")
    }
  ];
}
function normalizeTheme(value) {
  if (value === "dark" || value === "light" || value === "unifi-dark") return value;
  return "unifi";
}
function normalizeSvgTheme(value) {
  const valid = ["unifi", "unifi-dark", "minimal", "minimal-dark", "classic", "classic-dark"];
  return valid.includes(value ?? "") ? value : "unifi";
}
function normalizeIconSet(value) {
  return value === "isometric" ? "isometric" : "modern";
}

// src/card/core/unifi-network-map-editor.ts
var UnifiNetworkMapEditor = class extends HTMLElement {
  constructor() {
    super(...arguments);
    this._entries = [];
    this._localize = createLocalize();
    this._boundOnChange = (event) => this._onChange(event);
  }
  set hass(hass) {
    this._hass = hass;
    this._localize = createLocalize(hass);
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
      if (!this._config?.entry_id && this._entries.length > 0) {
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
    this._updateFormState();
  }
  _updateFormState() {
    if (!this._form) {
      return;
    }
    this._form.hass = this._hass;
    this._form.computeLabel = (schema) => schema.label ?? this._localize(`editor.${schema.name}`) ?? schema.name;
    this._form.schema = this._buildFormSchema();
    this._form.data = this._buildFormData();
  }
  _buildFormData() {
    return {
      ...this._getFormDefaults(),
      ...this._getConfigFormValues()
    };
  }
  _getFormDefaults() {
    return {
      entry_id: "",
      theme: "unifi",
      svg_theme: "unifi",
      icon_set: "modern",
      card_height: ""
    };
  }
  _getConfigFormValues() {
    const cfg = this._config;
    if (!cfg) {
      return {};
    }
    const result = {};
    if (cfg.entry_id !== void 0) result.entry_id = cfg.entry_id;
    if (cfg.theme !== void 0) result.theme = cfg.theme;
    if (cfg.svg_theme !== void 0) result.svg_theme = cfg.svg_theme;
    if (cfg.icon_set !== void 0) result.icon_set = cfg.icon_set;
    if (cfg.card_height !== void 0) result.card_height = cfg.card_height;
    return result;
  }
  _renderNoEntries() {
    this.innerHTML = `
      <div style="padding: 16px;">
        <p style="color: var(--secondary-text-color);">
          ${this._localize("editor.no_entries")}
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
    return buildFormSchema(this._entries, this._localize);
  }
  _onChange(e) {
    const update = this._getConfigUpdate(e);
    if (!update || this._isConfigUnchanged(update)) {
      return;
    }
    this._updateConfig(update);
  }
  _updateConfigEntry(entryId) {
    this._updateConfig({
      entry_id: entryId,
      theme: this._config?.theme ?? "unifi",
      svg_theme: this._config?.svg_theme ?? "unifi",
      icon_set: this._config?.icon_set ?? "modern"
    });
  }
  _updateConfig(update) {
    this._config = {
      ...this._config,
      type: "custom:unifi-network-map",
      entry_id: update.entry_id,
      theme: update.theme,
      svg_theme: update.svg_theme,
      icon_set: update.icon_set,
      card_height: update.card_height
    };
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true
      })
    );
  }
  _getConfigUpdate(e) {
    const detail = e.detail;
    const entryId = this._resolveEntryId(detail.value);
    const themeValue = this._resolveTheme(detail.value);
    const svgThemeValue = detail.value?.svg_theme ?? this._config?.svg_theme;
    const iconSetValue = detail.value?.icon_set ?? this._config?.icon_set;
    const cardHeight = this._resolveCardHeight(detail.value);
    return {
      entry_id: entryId,
      theme: normalizeTheme(themeValue),
      svg_theme: normalizeSvgTheme(svgThemeValue),
      icon_set: normalizeIconSet(iconSetValue),
      card_height: cardHeight
    };
  }
  _resolveEntryId(value) {
    return value?.entry_id ?? this._config?.entry_id ?? "";
  }
  _resolveTheme(value) {
    return value?.theme ?? this._config?.theme ?? "unifi";
  }
  _resolveCardHeight(value) {
    return value?.card_height ?? this._config?.card_height;
  }
  _isConfigUnchanged(update) {
    return this._config?.entry_id === update.entry_id && this._config?.theme === update.theme && this._config?.svg_theme === update.svg_theme && this._config?.icon_set === update.icon_set && this._config?.card_height === update.card_height;
  }
};

// src/unifi-network-map.ts
var CARD_VERSION = "0.2.0";
customElements.define("unifi-network-map", UnifiNetworkMapCard);
customElements.define("unifi-network-map-editor", UnifiNetworkMapEditor);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "unifi-network-map",
  name: "UniFi Network Map",
  description: "Displays your UniFi network topology as an interactive SVG map",
  preview: true,
  documentationURL: "https://github.com/merlijntishauser/unifi-network-maps"
});
console.info(`unifi-network-map card loaded v${CARD_VERSION}`);
/*! Bundled license information:

dompurify/dist/purify.es.mjs:
  (*! @license DOMPurify 3.3.1 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.3.1/LICENSE *)
*/
