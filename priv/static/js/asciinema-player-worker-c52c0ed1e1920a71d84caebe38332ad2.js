(function () {
  'use strict';

  function parseNpt(time) {
    if (typeof time === "number") {
      return time;
    } else if (typeof time === "string") {
      return time.split(":").reverse().map(parseFloat).reduce((sum, n, i) => sum + n * Math.pow(60, i));
    } else {
      return undefined;
    }
  }

  class DummyLogger {
    log() {}
    debug() {}
    info() {}
    warn() {}
    error() {}
  }
  class PrefixedLogger {
    constructor(logger, prefix) {
      this.logger = logger;
      this.prefix = prefix;
    }
    log(message) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      this.logger.log(`${this.prefix}${message}`, ...args);
    }
    debug(message) {
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }
      this.logger.debug(`${this.prefix}${message}`, ...args);
    }
    info(message) {
      for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        args[_key3 - 1] = arguments[_key3];
      }
      this.logger.info(`${this.prefix}${message}`, ...args);
    }
    warn(message) {
      for (var _len4 = arguments.length, args = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
        args[_key4 - 1] = arguments[_key4];
      }
      this.logger.warn(`${this.prefix}${message}`, ...args);
    }
    error(message) {
      for (var _len5 = arguments.length, args = new Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
        args[_key5 - 1] = arguments[_key5];
      }
      this.logger.error(`${this.prefix}${message}`, ...args);
    }
  }

  let wasm;
  function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];
    heap[idx] = obj;
    return idx;
  }
  function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
      return `${val}`;
    }
    if (type == 'string') {
      return `"${val}"`;
    }
    if (type == 'symbol') {
      const description = val.description;
      if (description == null) {
        return 'Symbol';
      } else {
        return `Symbol(${description})`;
      }
    }
    if (type == 'function') {
      const name = val.name;
      if (typeof name == 'string' && name.length > 0) {
        return `Function(${name})`;
      } else {
        return 'Function';
      }
    }
    // objects
    if (Array.isArray(val)) {
      const length = val.length;
      let debug = '[';
      if (length > 0) {
        debug += debugString(val[0]);
      }
      for (let i = 1; i < length; i++) {
        debug += ', ' + debugString(val[i]);
      }
      debug += ']';
      return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
      className = builtInMatches[1];
    } else {
      // Failed to match the standard '[object ClassName]'
      return toString.call(val);
    }
    if (className == 'Object') {
      // we're a user defined class or Object
      // JSON.stringify avoids problems with cycles, and is generally much
      // easier than looping through ownProperties of `val`.
      try {
        return 'Object(' + JSON.stringify(val) + ')';
      } catch (_) {
        return 'Object';
      }
    }
    // errors
    if (val instanceof Error) {
      return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
  }
  function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
  }
  function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
  }
  let cachedDataViewMemory0 = null;
  function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer) {
      cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
  }
  function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
  }
  let cachedUint32ArrayMemory0 = null;
  function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
      cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
  }
  let cachedUint8ArrayMemory0 = null;
  function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
      cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
  }
  function getObject(idx) {
    return heap[idx];
  }
  let heap = new Array(128).fill(undefined);
  heap.push(undefined, null, true, false);
  let heap_next = heap.length;
  function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
      const buf = cachedTextEncoder.encode(arg);
      const ptr = malloc(buf.length, 1) >>> 0;
      getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
      WASM_VECTOR_LEN = buf.length;
      return ptr;
    }
    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;
    const mem = getUint8ArrayMemory0();
    let offset = 0;
    for (; offset < len; offset++) {
      const code = arg.charCodeAt(offset);
      if (code > 0x7F) break;
      mem[ptr + offset] = code;
    }
    if (offset !== len) {
      if (offset !== 0) {
        arg = arg.slice(offset);
      }
      ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
      const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
      const ret = cachedTextEncoder.encodeInto(arg, view);
      offset += ret.written;
      ptr = realloc(ptr, len, offset, 1) >>> 0;
    }
    WASM_VECTOR_LEN = offset;
    return ptr;
  }
  function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
  }
  let cachedTextDecoder = new TextDecoder('utf-8', {
    ignoreBOM: true,
    fatal: true
  });
  cachedTextDecoder.decode();
  const MAX_SAFARI_DECODE_BYTES = 2146435072;
  let numBytesDecoded = 0;
  function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
      cachedTextDecoder = new TextDecoder('utf-8', {
        ignoreBOM: true,
        fatal: true
      });
      cachedTextDecoder.decode();
      numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
  }
  const cachedTextEncoder = new TextEncoder();
  if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
      const buf = cachedTextEncoder.encode(arg);
      view.set(buf);
      return {
        read: arg.length,
        written: buf.length
      };
    };
  }
  let WASM_VECTOR_LEN = 0;
  const VtFinalization = typeof FinalizationRegistry === 'undefined' ? {
    register: () => {},
    unregister: () => {}
  } : new FinalizationRegistry(ptr => wasm.__wbg_vt_free(ptr >>> 0, 1));
  class Vt {
    static __wrap(ptr) {
      ptr = ptr >>> 0;
      const obj = Object.create(Vt.prototype);
      obj.__wbg_ptr = ptr;
      VtFinalization.register(obj, obj.__wbg_ptr, obj);
      return obj;
    }
    __destroy_into_raw() {
      const ptr = this.__wbg_ptr;
      this.__wbg_ptr = 0;
      VtFinalization.unregister(this);
      return ptr;
    }
    free() {
      const ptr = this.__destroy_into_raw();
      wasm.__wbg_vt_free(ptr, 0);
    }
    /**
     * @returns {any}
     */
    getCursor() {
      const ret = wasm.vt_getCursor(this.__wbg_ptr);
      return takeObject(ret);
    }
    /**
     * @param {string} s
     * @returns {any}
     */
    feed(s) {
      const ptr0 = passStringToWasm0(s, wasm.__wbindgen_export, wasm.__wbindgen_export2);
      const len0 = WASM_VECTOR_LEN;
      const ret = wasm.vt_feed(this.__wbg_ptr, ptr0, len0);
      return takeObject(ret);
    }
    /**
     * @param {number} cols
     * @param {number} rows
     * @returns {any}
     */
    resize(cols, rows) {
      const ret = wasm.vt_resize(this.__wbg_ptr, cols, rows);
      return takeObject(ret);
    }
    /**
     * @param {number} row
     * @param {boolean} cursor_on
     * @returns {any}
     */
    getLine(row, cursor_on) {
      const ret = wasm.vt_getLine(this.__wbg_ptr, row, cursor_on);
      return takeObject(ret);
    }
    /**
     * @returns {Uint32Array}
     */
    getSize() {
      try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.vt_getSize(retptr, this.__wbg_ptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v1 = getArrayU32FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export3(r0, r1 * 4, 4);
        return v1;
      } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
      }
    }
  }
  if (Symbol.dispose) Vt.prototype[Symbol.dispose] = Vt.prototype.free;

  /**
   * @param {number} cols
   * @param {number} rows
   * @param {number} scrollback_limit
   * @param {boolean} bold_is_bright
   * @returns {Vt}
   */
  function create(cols, rows, scrollback_limit, bold_is_bright) {
    const ret = wasm.create(cols, rows, scrollback_limit, bold_is_bright);
    return Vt.__wrap(ret);
  }
  const EXPECTED_RESPONSE_TYPES = new Set(['basic', 'cors', 'default']);
  async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
      if (typeof WebAssembly.instantiateStreaming === 'function') {
        try {
          return await WebAssembly.instantiateStreaming(module, imports);
        } catch (e) {
          const validResponse = module.ok && EXPECTED_RESPONSE_TYPES.has(module.type);
          if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
            console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
          } else {
            throw e;
          }
        }
      }
      const bytes = await module.arrayBuffer();
      return await WebAssembly.instantiate(bytes, imports);
    } else {
      const instance = await WebAssembly.instantiate(module, imports);
      if (instance instanceof WebAssembly.Instance) {
        return {
          instance,
          module
        };
      } else {
        return instance;
      }
    }
  }
  function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg___wbindgen_debug_string_adfb662ae34724b6 = function (arg0, arg1) {
      const ret = debugString(getObject(arg1));
      const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
      const len1 = WASM_VECTOR_LEN;
      getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
      getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg___wbindgen_throw_dd24417ed36fc46e = function (arg0, arg1) {
      throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_new_13317ed16189158e = function () {
      const ret = new Array();
      return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_4ceb6a766bf78b04 = function () {
      const ret = new Object();
      return addHeapObject(ret);
    };
    imports.wbg.__wbg_set_3f1d0b984ed272ed = function (arg0, arg1, arg2) {
      getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
    };
    imports.wbg.__wbg_set_8b6a9a61e98a8881 = function (arg0, arg1, arg2) {
      getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
    };
    imports.wbg.__wbindgen_cast_2241b6af4c4b2941 = function (arg0, arg1) {
      // Cast intrinsic for `Ref(String) -> Externref`.
      const ret = getStringFromWasm0(arg0, arg1);
      return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_4625c577ab2ec9ee = function (arg0) {
      // Cast intrinsic for `U64 -> Externref`.
      const ret = BigInt.asUintN(64, arg0);
      return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_d6cd19b81560fd6e = function (arg0) {
      // Cast intrinsic for `F64 -> Externref`.
      const ret = arg0;
      return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_object_clone_ref = function (arg0) {
      const ret = getObject(arg0);
      return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_object_drop_ref = function (arg0) {
      takeObject(arg0);
    };
    return imports;
  }
  function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedDataViewMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    return wasm;
  }
  function initSync(module) {
    if (wasm !== undefined) return wasm;
    if (typeof module !== 'undefined') {
      if (Object.getPrototypeOf(module) === Object.prototype) {
        ({
          module
        } = module);
      } else {
        console.warn('using deprecated parameters for `initSync()`; pass a single object instead');
      }
    }
    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
      module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
  }
  async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;
    if (typeof module_or_path !== 'undefined') {
      if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
        ({
          module_or_path
        } = module_or_path);
      } else {
        console.warn('using deprecated parameters for the initialization function; pass a single object instead');
      }
    }
    const imports = __wbg_get_imports();
    if (typeof module_or_path === 'string' || typeof Request === 'function' && module_or_path instanceof Request || typeof URL === 'function' && module_or_path instanceof URL) {
      module_or_path = fetch(module_or_path);
    }
    const {
      instance,
      module
    } = await __wbg_load(await module_or_path, imports);
    return __wbg_finalize_init(instance, module);
  }

  var exports$1 = /*#__PURE__*/Object.freeze({
      __proto__: null,
      Vt: Vt,
      create: create,
      default: __wbg_init,
      initSync: initSync
  });

  const base64codes = [62,0,0,0,63,52,53,54,55,56,57,58,59,60,61,0,0,0,0,0,0,0,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,0,0,0,0,0,0,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51];

              function getBase64Code(charCode) {
                  return base64codes[charCode - 43];
              }

              function base64Decode(str) {
                  let missingOctets = str.endsWith("==") ? 2 : str.endsWith("=") ? 1 : 0;
                  let n = str.length;
                  let result = new Uint8Array(3 * (n / 4));
                  let buffer;

                  for (let i = 0, j = 0; i < n; i += 4, j += 3) {
                      buffer =
                          getBase64Code(str.charCodeAt(i)) << 18 |
                          getBase64Code(str.charCodeAt(i + 1)) << 12 |
                          getBase64Code(str.charCodeAt(i + 2)) << 6 |
                          getBase64Code(str.charCodeAt(i + 3));
                      result[j] = buffer >> 16;
                      result[j + 1] = (buffer >> 8) & 0xFF;
                      result[j + 2] = buffer & 0xFF;
                  }

                  return result.subarray(0, result.length - missingOctets);
              }

              var vtWasmModule = base64Decode("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CyAAQQJqIQAMAQsLIAFBAkECEEkMLQsgBCgCSEEBdCEGQQAhACAEKAJEIQEgBCgCQANAIAAgBkcEQAJAAkACQAJAAkACQAJAAkACQCAAIAFqLwEAIgVBAWsOBwEvLy8vAgMACyAFQZcIaw4DBgQFAwsgA0EBOgDBAQwGCyADQQE6AL4BIANBADYCaCADIAMoAqgBNgJsDAULIANBAToAvwEMBAsgA0EBOgBwDAMLIAMQYQwCCyADEGELIwBBMGsiBSQAIAMtALwBQQFHBEAgA0EBOgC8ASADQfQAaiADQYgBakEFEHEgAyADQSRqQQkQcSAFQQxqIgogAygCnAEgAygCoAEiFEEBQQAgA0GyAWoQHCADQQxqEJoBIAMgCkEk/AoAACADKAJgIAMoAmRBACAUEFYLIAVBMGokACADEBALIABBAmohAAwBCwsgAUECQQIQSQwsCwJAQQEgBC8BPiIAIABBAU0bQQFrIgAgBC8BQCIBIAMoAqABIgUgARtBAWsiAUkgASAFSXFFBEAgAygCqAEhAAwBCyADIAE2AqwBIAMgADYCqAELIANBADYCaCADIABBACADLQC+ARs2AmwMKwsgA0EBOgBwIANBADsAvQEgA0EAOwG6ASADQQI6ALYBIANBAjoAsgEgA0EAOwGwASADQgA3AqQBIANBgICACDYChAEgA0ECOgCAASADQQI6AHwgA0IANwJ0IAMgAygCoAFBAWs2AqwBDCoLIAMoAqABIAMoAqwBIgBBAWogACADKAJsIgBJGyEBIAMgACABQQEgBC8BPiIFIAVBAU0bIAcQGyADKAJgIAMoAmQgACABEFYMKQsgAyADKAJoIAMoAmwiAEEAQQEgBC8BPiIBIAFBAU0bIAcQISADKAJgIAMoAmQgABCMAQwoCwJAAkACQCAELQA9QQFrDgMBAioACyADIAMoAmggAygCbCIAQQEgBCAHECEgAygCYCADKAJkIAAgAygCoAEQVgwpCyADIAMoAmggAygCbCIAQQIgBCAHECEgAygCYCADKAJkQQAgAEEBahBWDCgLIANBACADKAIcIAcQKCADKAJgIAMoAmRBACADKAKgARBWDCcLIAMgAygCaCADKAJsIgAgBC0APUEEciAEIAcQISADKAJgIAMoAmQgABCMAQwmCyADIAQtAD06ALEBDCULIAMgBC0APToA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KQP4ATcCACAAQQo6AAAMDAsgAkGAAmpBASABKAIAIAEoAgRB2J/EABB3IAEgAikDgAI3AgAgAEELOgAADAsLIAJBiAJqQQEgASgCACABKAIEQeifxAAQdyABIAIpA4gCNwIAIABBDDoAAAwKCyACQZACakEBIAEoAgAgASgCBEH4n8QAEHcgASACKQOQAjcCACAAQQ06AAAMCQsCQAJAAkAgA0Eea0H//wNxQQhPBEAgA0Emaw4CAgEDCyACQQhqQQEgASgCACABKAIEQZiixAAQdyABIAIpAwg3AgAgACADQR5rOgACIABBDjsAAAwLCyACQaABakEBIAEoAgAgASgCBEHooMQAEHcgASACKQOgATcCACAAQQ86AAAMCgsgASgCACEDIAEoAgQiBEECSQ0EIAJBmAFqIANBEGoQegJAAkACQCACKAKcAUEBRw0AIAIoApgBLwEAQQJrDgQBAAACAAsgAkHwAGpBASABKAIAIAEoAgRB2KDEABB3IAIoAnAhBCACKAJ0DA0LIAEoAgAhAyABKAIEIgRBBU8EQCADLQAkIQUgAy8BNCEGIAMvAUQhByACQYABakEFIAMgBEGYoMQAEHcgASACKQOAATcCACAAQQ46AAAgACAFIAZBCHRBgP4DcSAHQRB0cnJBCHRBAXI2AAEMCwsgAkH4AGpBAiADIARBqKDEABB3IAIoAnghBCACKAJ8DAwLIAEoAgAhAyABKAIEIgRBA08EQCADLQAkIQUgAkGQAWpBAyADIARBuKDEABB3IAEgAikDkAE3AgAgACAFOgACIABBDjsAAAwKCyACQYgBakECIAMgBEHIoMQAEHcgAigCiAEhBCACKAKMAQwLCwJAAkACQCADQfj/A3FBKEcEQCADQTBrDgICAQMLIAJBEGpBASABKAIAIAEoAgRBiKLEABB3IAEgAikDEDcCACAAIANBKGs6AAIgAEEQOwAADAsLIAJB4ABqQQEgASgCACABKAIEQdihxAAQdyABIAIpA2A3AgAgAEEROgAADAoLIAEoAgAhAyABKAIEIgRBAkkNBSACQdgAaiADQRBqEHoCQAJAAkAgAigCXEEBRw0AIAIoAlgvAQBBAmsOBAEAAAIACyACQTBqQQEgASgCACABKAIEQcihxAAQdyACKAIwIQQgAigCNAwNCyABKAIAIQMgASgCBCIEQQVP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AgAiAiACIAMoAgRBBHRqECUgA0E7aiABQQhqKAIANgAAIAMgAykCQDcAMyAAQSs6AAAgACADKQAwNwABIABBCGogA0E3aikAADcAAAwbCyADQQhqIAQgASgChARBuJfEABCHASADQUBrIgEgAygCCCICIAIgAygCDEEEdGoQJSADQTtqIAFBCGooAgA2AAAgAyADKQJANwAzIABBJToAACAAIAMpADA3AAEgAEEIaiADQTdqKQAANwAADBoLIANBGGogBCABKAKEBEHIl8QAEIcBIAMgAykDGDcCTCADQdYAaiADQcwAahANAn8gAy0AVkESRgRAQQAhAUEAIQRBAQwBCyADQRBqQQRBAUEFEF0gAygCECEBIAMoAhQiBCADKABWNgAAIARBBGogA0HaAGotAAA6AAAgA0EBNgI4IAMgBDYCNCADIAE2AjAgAyADKQJMNwJAQQUhAkEBIQEDQCADQdsAaiADQUBrEA0gAy0AW0ESRkUEQCADKAIwIAFGBEAgA0EwaiABQQFBAUEFEGogAygCNCEECyACIARqIgUgAygAWzYAACAFQQRqIANB3wBqLQAAOgAAIAMgAUEBaiIBNgI4IAJBBWohAgwBCwsgAygCMCEEIAMoAjQLIQIgACABNgIMIAAgAjYCCCAAIAQ2AgQgAEEpOgAADBkLIABBEzoAACAAIAEvARg7AQQgACABLwEIOwECDBgLIABBJzoAAAwXCyAAQSY6AAAMFgsgAEEyOgAADBULIABBFzsBAAwUCyAAQZcCOwEADBMLIABBlwQ7AQAMEgsgAEGXBjsBAAwRCyAAQTI6AAAMEAsgAEEYOwEADA8LIABBmAI7AQAMDgsgAEGYBDsBAAwNCyAAQTI6AAAMDAsgAEEHOwEADAsLIABBhwI7AQAMCgsgAEGHBDsBAAwJCyAAQTI6AAAMCAsgAEEuOwEADAcLIABBrgI7AQAMBgsgAS8BCEEIRg0DIABBMjoAAAwFCyAFQSFHDQMgAEEUOgAADAQLIAVBP0cNAiADQSBqIAQgASgChARB2JfEABCHASADQUBrIgEgAygCICICIAIgAygCJEEEdGoQJiADQTtqIAFBCGooAgA2AAAgAyADKQJANwAzIABBEjoAACAAIAMpADA3AAEgAEEIaiADQTdqKQAANwAADAMLIAVBP0cNASADQShqIAQgASgChARB6JfEABCHASADQUBrIgEgAygCKCICIAIgAygCLEEEdGoQJiADQTtqIAFBCGooAgA2AAAgAyADKQJANwAzIABBEDoAACAAIAMpADA3AAEgAEEIaiADQTdqKQAANwAADAILIABBMToAACAAIAEvARg7AQQgACABLwEoOwECDAELIABBMjoAAAsgA0HgAGokAAvlCwEOfyMAQeAAayICJAAgAUEEaiEJIAJB0ABqIQsgAkE1aiEMIAJBLGohDSABKAIkIQUgAkEcaiEOIAEoAhQhDyABKAIQIQcCQAJAAn8CQAJAAkADQCABKAIAIQMgAUGAgICAeDYCAAJAAkACQAJAAkAgA0GAgICAeEcEQCACQRBqIAlBCGooAgA2AgAgAiAJKQIANwMIIAchBAwBCyAHIA9GDQEgASAHQRBqIgQ2AhAgAkEQaiAHQQxqKAIANgIAIAIgBykCBDcDCCAHKAIAIgNBgICAgHhGDQELIA4gAikDCDcCACAOQQhqIAJBEGooAgA2AgAgAiADNgIYIAUgAigCICIDSyADIAVLa0H/AXEOAgIDAQsgAEGAgICAeDYCACABQYCAgIB4NgIADAkLAkAgAi0AJA0AIAMgAigCHCADEDBrIgQgBSAEIAVLGyIEIANLDQAgAiAENgIgIAQhAwsCf0GAgICAeCADIAVNDQAaAkACQCACKAIcIAMgBUHwksQAEIsBKAIERQRAIAJByABqIgMgAkEYaiIEIAVBAWsQPiACQUBrIANBCGooAgA2AgAgAiACKQJINwM4IAItACQhByADQRBqIAIoAhwgAigCICIFIAVBAWtBkJPEABCLASIFQRBqLwEAOwEAIAJCoICAgBA3AkggAiAFKQIINwJQIAQgAxBXIAIgBzoARCACLQAkRQ0BDAILIAJByABqIgMgAkEYaiAFED4gAkFAayADQQhqKAIANgIAIAIgAikCSDcDOCACIAItACQiAzoARCADDQELIAJBOGoQhgELIAIoAkAEQCACQdAAaiACQcQAaigCADYCACACQQE6ACQgAiACKQI8NwNIIAIoAjgMAQsgAigCOCACKAI8QQRBFBBJQYCAgIB4CyEEQYCAgIB4IAEoAgQQngEgASAENgIAIAkgAikDSDcCACAJQQhqIAJB0ABqKAIANgIAIABBCGogAkEgaikCADcCACAAIAIpAhg3AgAMCAsgACACKQIYNwIAIABBCGogAkEgaikCADcCAAwHCyAEIA9GDQEgASAEQRBqIgc2AhAgBCgCACIKQYCAgIB4Rg0BIARBDGooAgAhBiANIAQpAgQ3AgAgDUEIaiAGNgIAIAIgCjYCKCAFIANrIgZFDQMgAi0AJEUEQCACQQA7AFAgAkECOgBMIAJBAjoASCACQRhqIAUgAkHIAGoQQAwECyACLQA0RQRAIAJBKGoQhgELIAIoAiwhBCACKAIwIgggBk0EQCACQRhqIgMgBCAIEHICQCACLQA0IgYNACACQQA6ACQgAigCICAFTw0AIAJBADsAUCACQQI6AEwgAkECOgBIIAMgBSACQcgAahBACyACKAIoIARBBEEUEEkgBkUNBkGAgICAeCABKAIEEJ4BIAFBCGogAkEgaikCADcCACABIAIpAhg3AgBBgICAgHggAhCeAQwBCwsgBCAIIAZBwJLEABCLASgCBEUEQCALQQhqIAIoAhwgAyADQQFrQdCSxAAQiwEiA0EQai8BADsBACALIAMpAgg3AgAgAkKggICAEDcCSCACQRhqIAJByABqEFcgBkEBayEGCyAGIAhNDQFBACAGIAhB4JLEABBtAAsgAkEAOwBQIAJBAjoATCACQQI6AEggAkEYaiIBIAUgAkHIAGoQQCAAIAIpAhg3AgAgAkEAOgAkIABBCGogAUEIaikCADcCAAwECyACQRhqIAQgBhByIAIoAighCiAEIAggBhCDASAKQYCAgIB4Rg0CIAItADQhByAIIAZrIgMgCCADIAhJGwwBCyACQTpqIAxBAmotAAA6AAAgAiAMLwAAOwE4IAItADQhByACKAIsIQQgAigCMAshA0GAgICAeCABKAIEEJ4BIAEgBzoADCABIAM2AgggASAENgIEIAEgCjYCACABIAIvATg7AA0gAUEPaiACQTpqLQAAOgAACyAAIAIpAhg3AgAgAEEIaiACQSBqKQIANwIACyACQeAAaiQAC8YKARB/IwBBkAFrIgIkACAAKAJsIgUgACgCHCIHayIBQQAgASAAKAIUIgYgB2sgBWpNGyENIAUgBmohAyAGQQR0IgEgACgCECIIaiEPIAAoAhghDCAAKAJoIQ4gACgCoAEhCyAAKAKcASEJIAghBANAAkAgAyAHRg0AIAFFDQAgCiAMakEAIAQtAAwiEBsh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IghBCGoiCikCADcDACAGIAgpAgA3AwAgAiADaiEBA0AgBSABQQR0aiIHKQIAIQsgByAGKQMANwIAIAQpAwAhDCAEIAdBCGoiBykCADcDACAHIAw3AgAgBiALNwMAIAAgAUsEQCABIAJqIQEMAQsgAyABIABrIgFHDQALIAggBikDADcCACAKIAQpAwA3AgAgA0EBaiEDDAALAAsACwALIAEgAEEEdCIAayIDIAJBBHQiAmohBCAFRQRAIABFIgVFBEAgBiADIAD8CgAACyACBEAgAyABIAL8CgAACyAFDQEgBCAGIAD8CgAADAELIAJFIgVFBEAgBiABIAL8CgAACyAABEAgBCADIAD8CgAACyAFDQAgAyAGIAL8CgAACyAGQaABaiQAC7IEAQx/IAFBAWshDSAAKAIEIQkgACgCACEKIAAoAgghCwJAA0AgBg0BAn8CQCACIARJDQADQCABIARqIQUCQAJAAkACQAJAIAIgBGsiBkEHTQRAIAIgBEcNASACIQQMBwsgBUEDakF8cSIAIAVGDQEgACAFayEDQQAhAANAIAAgBWotAABBCkYNBSADIABBAWoiAEcNAAsgBkEIayIAIANJDQMMAgtBACEAA0AgACAFai0AAEEKRg0EIAYgAEEBaiIARw0ACyACIQQMBQsgBkEIayEAQQAhAwsDQCADIAVqIgcoAgAiDkGAgoQIIA5BipSo0ABza3IgB0EEaigCACIHQYCChAggB0GKlKjQAHNrcnFBgIGChHhxQYCBgoR4Rw0BIAAgA0EIaiIDTw0ACwsgAyAGRgRAIAIhBAwDCyADIAVqIQYgAiADayAEayEHQQAhAAJAA0AgACAGai0AAEEKRg0BIAcgAEEBaiIARw0ACyACIQQMAwsgACADaiEACyAAIARqIgNBAWohBAJAIAIgA00NACAAIAVqLQAAQQpHDQBBACEGIAQiBQwDCyACIARPDQALCyACIAhGDQJBASEGIAghBSACCyEAAkAgCy0AAARAIApBnKfEAEEEIAkoAgwRAwANAQsgACAIayEHQQAhAyAAIAhHBEAgACANai0AAEEKRiEDCyABIAhqIQAgCyADOgAAIAUhCCAKIAAgByAJKAIMEQMARQ0BCwtBASEMCyAMC7gEAQh/IwBBEGsiAyQAIAMgATYCBCADIAA2AgAgA0KggICADjcCCAJ/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IAAgAykCHDcCACAAQQhqIANBJGooAgA2AgAMAQsgAEEANgIIIABCgICAgCA3AgALIANBMGokAAv/AQEDfyMAQTBrIgMkACADIAI2AhggAyABNgIUAkAgA0EUahBFQf//A3EiAQRAIANBCGpBBEECQQIQXSADKAIIIQIgAygCDCIEIAE7AQAgA0EBNgIkIAMgBDYCICADIAI2AhwgAyADKQIUNwIoQQIhAUEBIQIDQCADQShqEEVB//8DcSIFBEAgAygCHCACRgRAIANBHGogAkEBQQJBAhBqIAMoAiAhBAsgASAEaiAFOwEAIAMgAkEBaiICNgIkIAFBAmohAQwBCwsgACADKQIcNwIAIABBCGogA0EkaigCADYCAAwBCyAAQQA2AgggAEKAgICAIDcCAAsgA0EwaiQAC4oCAQN/AkACQCABIAJGDQAgACABIAJBuI7EABCLASgCBEUEQCAAIAEgAkEBa0HIjsQAEIsBIgVCoICAgBA3AgAgBSAEKQAANwAIIAVBEGogBEEIai8AADsAAAsgAiADSw0BIAEgA0kNASADQRRsIgYgAkEUbCICayEFIAAgAmohAiAEQQhqIQcDQCAFBEAgAkKggICAEDcCACACIAQpAAA3AAggAkEQaiAHLwAAOwAAIAVBFGshBSACQRRqIQIMAQsLIAEgA00NACAAIAZqIgAoAgQNACAAQqCAgIAQNwIAIAAgBCkAADcACCAAQRBqIARBCGovAAA7AAALDwsgAiADIAFB2I7EABBtAAv/AQECfyMAQTBrIgQkACAEQRBqIAAoAhggAxApIARBCGogABBrIAQgASACIAQoAgggBCgCDEHAlMQAEHACQCAEKAIEIgBFBEAgBCgCECAEKAIUQQRBFBBJDAELIABBBHQiAUEQayEDIAEgBCgCACIAaiICQRBrIQEDQCADBEAgBEEgaiIFIARBEGoQRyAAKAIAIABBBGooAgBBBEEUEEkgAEEIaiAFQQhqKQIANwIAIAAgBCkCIDcCACADQRBrIQMgAEEQaiEADAELCyABKAIAIAJBDGsoAgBBBEEUEEkgAUEIaiAEQRhqKQIANwIAIAEgBCkCEDcCAAsgBEEwaiQAC/oBAQV/IwBBIGsiAyQAIANBCGogAUEEQRQQXSADQQA2AhwgAyADKQMINwIUIANBFGogARCJAUEBIAEgAUEB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AX8jAEFAaiIDJAAgA0EcaiAAEFogAygCHCIAIAEgAhAjIANBKGogACgCYCAAKAJkECAgA0EQaiAAECIgAyADKQMQNwI0IANBCGogAygCLCADKAIwEFggAygCDCEAIAMoAghBAXEEQCADIAA2AjwgA0E8akGEi8QAEEEACyADQShqEGggAygCIEEANgIAIAMoAiQQlwEgA0FAayQAIAALmQEBA38CQCAAKAKEBCIBQSBJBEAgAEEEaiECIAFBBHRBEGohAQNAIAEEQCACKAIAIgNBBk8NAyADQQF0QQJqIgMEQCACQQRqQQAgA/wLAAsgAkEANgIAIAFBEGshASACQRBqIQIMAQsLIABBgIDEADYCACAAQQA2AoQEDwtBACABQSBB+JfEABBtAAtBACADQQZB+JbEABBtAAuiAQEBfyMAQRBrIgMkAAJAIABFDQAgAkUNAAJAIAFBBE0EQCACQQNqQQJ2QQFrIgFBgAJJDQELIANB6OzEACgCADYCCCAAIANBCGpB5OTEAEEFEC5B6OzEACADKAIINgIADAELIANB6OzEADYCBCADIAFBAnQiASgC6ORENgIMIAAgA0EMaiADQQRqQQYQLiABIAMoAgw2AujkRAsgA0EQaiQAC6cBAQN/IwBBQGoiAyQAIANBFGoiBCAAKAIAEAIgAygCFCEAIANBCGoiBSADKAIYNgIEIAUgADYCACADIAMoAgwiADYCNCADIAMoAgg2AjAgAyAANgIsIANBAjYCGCADQbTkxAA2AhQgA0IBNwIgIANBBzYCPCADIANBOGo2AhwgAyADQSxqNgI4IAEgAiAEEBcgAygCLCADKAIwQQFBARBJIANBQGskAAuRAQECfyMAQZAGayIDJAAgABChASAAQQhrIQICQAJAIAFFBEAgAigCAEEBRw0CIAMgAEEEakGQBvwKAAAgAkEANgIAAkAgAkF/Rg0AIABBBGsiASgCAEEBayEAIAEgADYCACAADQAgAkEEQZwGEDULIAMQRAwBCyACEJcBCyADQZAGaiQADwtBqYvEAEE/EKwBAAuNAQEEfyAAKAIAIAAoAggiBGsgAUkEQCAAIAQgAUEBQQEQaiAAKAIIIQQLIAAoAgQgBGohBUEBIAEgAUEBTRsiBkEBayEDAkADQCADBEAgBSACOgAAIANBAWshAyAFQQFqIQUMAQUCQCAEIAZqIQMgAQ0AIANBAWshAwwDCwsLIAUgAjoAAAsgACADNgIIC3oBAn8CfyACRQRAQQEMAQsDQCACQQFNBEACQCABIARBAnRqKAIAIgEgA0cNAEEADAMLBSAEIAJBAXYiBSAEaiIEIAEgBEECdGooAgAgA0sbIQQgAiAFayECDAELCyAEIAEgA0lqIQRBAQshAiAAIAQ2AgQgACACNgIACwMAAAuIAQECfyMAQRBrIgMkACADIAEoAgAiBSgCADYCDEEBIQRBgBAgAkECaiIBIAFsIgEgAUGAEE0bIgJBBCADQQxqQQFBAUECEEghASAFIAMoAgw2AgAgAQRAIAFCADcCBCABIAEgAkECdGpBAnI2AgBBACEECyAAIAE2AgQgACAENgIAIANBEGokAAuGAQIBfwF+AkACQCABrSADrX4iBUIgiKcNACAFpyIEIAJqQQFrIQEgASAESQ0AIANBCGoiAyABQQAgAmtxIgRqIQEgASADSQ0BQYCAgIB4IAJrIAFPBEAgACAENgIIIAAgATYCBCAAIAI2AgAPCyAAQQA2AgAPCyAAQQA2AgAPCyAAQQA2AgALfQECfyMAQRBrIgIkACACQoCAgIDAADcCBCACQQA2AgwgAUEIayIDQQAgASADTxtBB2pBA3YhAUEIIQMDQCABBEAgAUEBayEBIAJBBGogAxB7IANBCGohAwwBCwsgACACKQIENwIAIABBCGogAkEMaigCADYCACACQRBqJAAL4wEBBH8jAEEQayIEJAAgASgCCCIDIAJPBEAgBEEIaiADIAJrIgNBBEEUEF0gBCgCCCEFIAAgBCgCDCIGNgIEIAAgBTYCACABIAI2AgggACADNgIIIANBFGwiAARAIAYgASgCBCACQRRsaiAA/AoAAAsgBEEQaiQADwsjAEEwayIAJAAgACADNgIEIAAgAjYCACAAQQM2AgwgAEGEjcQANgIIIABCAjcCFCAAIABBBGqtQoCAgIDQAYQ3AyggACAArUKAgICA0AGENwMgIAAgAEEgajYCECAAQQhqQYCTxAAQhQEAC34BA38CQCAAKAIAIgFBAnENACABQXxxIgJFDQAgAiACKAIEQQNxIAAoAgRBfHFyNgIEIAAoAgAhAQsgACgCBCICQXxxIgMEQCADIAMoAgBBA3EgAUF8cXI2AgAgACgCBCECIAAoAgAhAQsgACACQQNxNgIEIAAgAUEDcTYCAAt/AQJ/IAAgASAAKAIIIgNrIgQQiQEgBARAIAMgAWshBCABIAAoAggiAWogA2shAyAAKAIEIAFBFGxqIQEDQCABQqCAgIAQNwIAIAFBCGogAikAADcAACABQRBqIAJBCGovAAA7AAAgAUEUaiEBIARBAWoiBA0ACyAAIAM2AggLC4IBAQF/IwBBQGoiAiQAIAJBKzYCDCACQbiJxAA2AgggAkGoicQANgIUIAIgADYCECACQQI2AhwgAkGwpsQANgIYIAJCAjcCJCACIAJBEGqtQoCAgICwAYQ3AzggAiACQQhqrUKAgICAwAGENwMwIAIgAkEwajYCICACQRhqIAEQhQEAC3cBAn8gASACp3EhA0EIIQQDQCAAIANqKQAAQoCBgoSIkKDAgH+DIgJCAFJFBEAgAyAEaiABcSEDIARBCGohBAwBCwsgAnqnQQN2IANqIAFxIgMgAGosAABBAE4EfyAAKQMAQoCBgoSIkKDAgH+DeqdBA3YFIAMLC2oAAn8gA0EDdEGAgAFqIgEgAkECdCICIAEgAksbQYeABGoiAUEQdkAAIgJBf0YEQEEAIQJBAQwBCyACQRB0IgJCADcCBCACIAIgAUGAgHxxakECcjYCAEEACyEDIAAgAjYCBCAAIAM2AgALiQEAIAAQmQEgAEEkahCZASAAKAJQIAAoAlRBBEEEEEkgACgCXCAAKAJgQQFBARBJIAAoAtAFIAAoAtQFQQJBCBBJIAAoAtwFIAAoAuAFQQJBDBBJIAAoAugFIAAoAuwFQQRBDBBJIAAoAvQFIAAoAvgFQQRBEBBJIAAoAoAGIAAoAoQGQQRBBBBJC3ABBH8gACgCACECIAAoAgQhAwJAA0AgAiADRgRAQQAPCyAAIAJBEGoiBDYCACACQQRqLwEAIgFBGU1BAEEBIAF0QcKBgBBxGw0BAkACQCABQZcIaw4DAQMDAAsgBCECIAFBL0cNAQsLQZcIIQELIAELgwEBAX8CQAJAAkACQAJAAkACQAJAAkACQAJAIAFBCGsOCAECAwMDBAUGAAtBMiECIAFBhAFrDgoCBgkJBwkJCQkICQsMCAtBGyECDAcLQR8hAgwGC0EGIQIMBQtBLCECDAQLQSohAgwDC0EgIQIMAgtBHCECDAELQSMhAgsgACACOgAAC2wBBX8jAEEQayICJAAgASgCBCEFIAJBCGogASgCCCIEQQRBFBBdIAIoAgghAyAAIAIoAgwiBjYCBCAAIAM2AgAgBEEUbCIDBEAgBiAFIAP8CgAACyAAIAQ2AgggACABLQAMOgAMIAJBEGokAAtrAQJ/IwBBEGsiBiQAAkAgACABIAIgAyAFEBoiBw0AIAZBCGogAyAAIAEgBBEFAEEAIQcgBigCCEEBcQ0AIAYoAgwiBCACKAIANgIIIAIgBDYCACAAIAEgAiADIAUQGiEHCyAGQRBqJAAgBwtfAQF/IwBBEGsiBCQAAn8gAEUEQEEAIQAgBEEMagwBCyAEIAI2AgwgACADbCEAIARBCGoLIAA2AgACQCAEKAIMIgBFDQAgBCgCCCICRQ0AIAEgACACEDULIARBEGokAAtrAQF/IwBBMGsiAyQAIAMgATYCBCADIAA2AgAgA0ECNgIMIANB9KbEADYCCCADQgI3AhQgAyADrUKAgICA0AGENwMoIAMgA0EEaq1CgICAgNABhDcDICADIANBIGo2AhAgA0EIaiACEIUBAAtrAQF/IwBBMGsiAyQAIAMgATYCBCADIAA2AgAgA0EDNgIMIANBlIzEADYCCCADQgI3AhQgAyADQQRqrUKAgICA0AGENwMoIAMgA61CgICAgNABhDcDICADIANBIGo2AhAgA0EIaiACEIUBAAtkAQZ/IAAoAgQhBSABLQAAQQFxIQYgACgCACIEIQMCQANAIAMgBUYEQEEADwsgACADQQRqIgc2AgAgBg0BIAMoAgAhCCAHIQMgAigCACAITw0ACyADQQRrIQQLIAFBAToAACAEC3UBAn8jAEEQayIDJABBjO3EAEGM7cQAKAIAIgRBAWo2AgACQCAEQQBIDQBBiO3EAC0AAEUEQEGE7cQAQYTtxAAoAgBBAWo2AgBBkO3EACgCAEEASA0BQYjtxABBADoAACACRQ0BAAsgA0EIaiAAIAERAAALAAtpAQJ/AkACQCAALQAAIgMgAS0AAEcNAEEBIQICQAJAIANBA2sOAgEAAwsgAC0AASABLQABRw0BQQAhAiAALQACIAEtAAJHDQIgAC0AAyABLQADRg8LIAAtAAEgAS0AAUYPC0EAIQILIAILZgECfyAAIAAoApwBQQFrIgMgACgCaCICIAIgA0sbNgJoIAAoAqwBIAAoAqABQQFrIAAtAL4BIgIbIQMgASAAKAKoAUEAIAIbIgFqIQIgACADIAEgAiABIAJLGyIAIAAgA0sbNgJsC2EBBH8gASgCCEEBayECIAEoAgAhBCABKAIEIQUDQCAFIAQiA0cEQCABIANBAWoiBDYCACABIAJBAmo2AgggAkEBaiECIAMtAABBAUcNAQsLIAAgAjYCBCAAIAMgBUc2AgALWwEDfyMAQSBrIgIkACACQQhqIAFBAUEBEF0gAkEUaiIDQQhqIgRBADYCACACIAIpAwg3AhQgAyABQQEQOCAAQQhqIAQoAgA2AgAgACACKQIUNwIAIAJBIGokAAtcAQR/IAAoAgRBBGshBCAAKAIAIQUgAS0AAEEBcSEGA0AgBSAEIgNBBGpGBEBBAA8LIAAgAzYCBCAGRQRAIANBBGshBCACKAIAIAMoAgBNDQELCyABQQE6AAAgAwtXAQR/IAAoAgAhAiAAKAIEIQMDQCACIANGBEBBAw8LIAAgAkEQaiIBNgIAIAJBBGohBCABIQJBBEEUQQMgBC8BACIBQRRGGyABQQRGGyIBQQNGDQALIAELYgEEfwJAIAEEQCAAKAIAIQIgACgCBCEDA0AgAiADRg0CIAAgAkEQaiIENgIAIAIoAgAiBUGAgICAeEYNAiAFIAJBBGooAgBBBEEUEEkgBCECIAFBAWsiAQ0ACwtBAA8LIAELWwECfyABEKEBIAFBCGsiAygCAEEBaiECIAMgAjYCAAJAIAIEQCABKAIAIgJBf0YNASAAIAM2AgggACABNgIEIAAgAUEEajYCACABIAJBAWo2AgAPCwALEKsBAAtPAAJAIAIgA0sNACABIANJDQAgAyACayEDIAAgAmohAgNAIAMEQCACQQE6AAAgA0EBayEDIAJBAWohAgwBCwsPCyACIAMgAUG4nMQAEG0AC5MBAQN/IAAoAgAiAyAAKAIIIgRGBEAjAEEQayICJAAgAkEIaiAAIANBAUEEQRQQHiACKAIIIgNBgYCAgHhHBEAgAigCDBogAxCjAQALIAJBEGokAAsgACAEQQFqNgIIIAAoAgQgBEEUbGoiACABKQIANwIAIABBCGogAUEIaikCADcCACAAQRBqIAFBEGooAgA2AgALTAECfyACQQJ0IQIQACEEA0AgAgRAIAQgAyABKAIAQQAQlgEQASACQQRrIQIgA0EBaiEDIAFBBGohAQwBCwsgACAENgIEIABBADYCAAtTAQF/IAAoAmwiASAAKAKsAUcEQCAAKAKgAUEBayABSwRAIAAgAUEBajYCbCAAIAAoApwBQQFrIgEgACgCaCIAIAAgAUsbNgJoCw8LIABBARCCAQtTAQJ/IAEQoQEgAUEIayICKAIAQQFqIQMgAiADNgIAAkAgAwRAIAEoAgANASAAIAI2AgggACABNgIEIAFBfzYCACAAIAFBBGo2AgAPCwALEKsBAAtRAQJ/IAAgACgCnAFBAWsiAiAAKAJoIgMgAiADSRs2AmggACABIAAoAmwiAWoiAiAAKAKgAUEBayAAKAKsASIAIAAgAUkbIgAgACACSxs2AmwLWAAgASACEFRFBEAgASgCACICIAEoAgRHBEAgASACQRBqNgIAIAAgAikCADcCACAAQQhqIAJBCGopAgA3AgAPCyAAQYCAgIB4NgIADwsgAEGAgICAeDYCAAvuAQIEfwF+IwBBEGsiBSQAIwBBEGsiBiQAIAVBBGoiBAJ/AkAgAiADakEBa0EAIAJrca0gAa1+IghCIIhQBEAgCKciA0GAgICAeCACa00NAQsgBEEANgIEQQEMAQsgA0UEQCAEIAI2AgggBEEANgIEQQAMAQsgBkEIaiACIAMQjwEgBigCCCIHRQRAIAQgAzYCCCAEIAI2AgRBAQwBCyAEIAc2AgggBCABNgIEQQALNgIAIAZBEGokACAFKAIIIQEgBSgCBEEBRgRAIAUoAgwaIAEQowEACyAAIAUoAgw2AgQgACABNgIAIAVBEGokAAtKAQJ/IAAgACgCnAFBAWsiAiAAKAJoIgMgAiADSRs2AmggACAAKAKoASICQQAgACgCbCIAIAJPGyICIAAgAWsiACAAIAJIGzYCbAs/AQF/IwBBEGsiAyQAIANBCGogABBrIAEgAygCDCIASQRAIAMoAgggA0EQaiQAIAFBBHRqDwsgASAAIAIQSgALRgEDfyABIAIgAxBCIgUgAWoiBC0AACEGIAQgA6dBGXYiBDoAACABIAIgBUEIa3FqQQhqIAQ6AAAgACAGOgAEIAAgBTYCAAtUAQF/IAAgACgCbDYCeCAAIAApAbIBNwF8IAAgAC8BvgE7AYYBIABBhAFqIABBugFqLwEAOwEAIAAgACgCnAFBAWsiASAAKAJoIgAgACABSxs2AnQLUQIBfwF+IwBBEGsiAiQAIAJBBGogARBVIAIoAgQpApwBIQNBCBCdASIBIAM3AgAgAigCCCACKAIMEJwBIABBAjYCBCAAIAE2AgAgAkEQaiQAC4MBAQN/IAAoAgAiAyAAKAIIIgRGBEAjAEEQayICJAAgAkEIaiAAIANBAUECQQwQHiACKAIIIgNBgYCAgHhHBEAgAigCDBogAxCjAQALIAJBEGokAAsgACAEQQFqNgIIIAAoAgQgBEEMbGoiACABKQEANwEAIABBCGogAUEIaigBADYBAAtJAQF/IwBBEGsiBSQAIAVBCGogARBrIAUgAiADIAUoAgggBSgCDCAEEHAgBSgCBCEBIAAgBSgCADYCACAAIAE2AgQgBUEQaiQAC08BAn8gACgCBCECIAAoAgAhAwJAIAAoAggiAC0AAEUNACADQZynxABBBCACKAIMEQMARQ0AQQEPCyAAIAFBCkY6AAAgAyABIAIoAhARAQALRgECfyMAQRBrIgEkACABQQhqIAAgACgCAEEBQQRBEBAeIAEoAggiAEGBgICAeEcEQCABKAIMIQIgABCjAQALIAFBEGokAAtGAQJ/IwBBEGsiASQAIAFBCGogACAAKAIAQQFBBEEEEB4gASgCCCIAQYGAgIB4RwRAIAEoAgwhAiAAEKMBAAsgAUEQaiQAC0YBAn8gACgCACAAKAIEQQRBBBBJIAAoAgwhAiAAKAIQIgAoAgAiAQRAIAIgAREEAAsgACgCBCIBBEAgAiAAKAIIIAEQNQsLQgEDfyABKAIUIgIgASgCHCIDayEEIAIgA0kEQCAEIAIgAkGglMQAEG0ACyAAIAM2AgQgACABKAIQIARBBHRqNgIAC0MBAn8jAEEQayIFJAAgBUEIaiAAIAEgAiADIAQQHiAFKAIIIgBBgYCAgHhHBEAgBSgCDCEGIAAQowEACyAFQRBqJAALQgEDfyABKAIUIgIgASgCHCIDayEEIAIgA0kEQCAEIAIgAkHglcQAEG0ACyAAIAM2AgQgACABKAIQIARBBHRqNgIAC0UAIAAtALwBQQFGBEAgAEEAOgC8ASAAQfQAaiAAQYgBakEFEHEgACAAQSRqQQkQcSAAKAJgIAAoAmRBACAAKAKgARBWCwvQAgACQCAAIAJNBEAgASACSw0BIAAgAU0NASMAQTBrIgIkACACIAE2AgQgAiAANgIAIAJBAjYCDCACQdClxAA2AgggAkICNwIUIAIgAkEEaq1CgICAgNABhDcDKCACIAKtQoCAgIDQAYQ3AyAgAiACQSBqNgIQIAJBCGogAxCFAQALIwBBMGsiASQAIAEgAjYCBCABIAA2AgAgAUECNgIMIAFB9KXEADYCCCABQgI3AhQgASABQQRqrUKAgICA0AGENwMoIAEgAa1CgICAgNABhDcDICABIAFBIGo2AhAgAUEIaiADEIUBAAsjAEEwayIAJAAgACACNgIEIAAgATYCACAAQQI2AgwgAEGcpcQANgIIIABCAjcCFCAAIABBBGqtQoCAgIDQAYQ3AyggACAArUKAgICA0AGENwMgIAAgAEEgajYCECAAQQhqIAMQhQEAC0IBAX8jAEEgayIDJAAgA0EANgIQIANBATYCBCADQgQ3AgggAyABNgIcIAMgADYCGCADIANBGGo2AgAgAyACEIUBAAtEAQF/IAEoAgAiAiABKAIERwRAIAEgAkEQajYCACAAIAIpAgA3AgAgAEEIaiACQQhqKQIANwIADwsgAEGAgICAeDYCAAs2AAJAIAEgAksNACACIARLDQAgACACIAFrNgIEIAAgAyABQQR0ajYCAA8LIAEgAiAEIAUQbQALOwEBfwNAIAIEQCAAKAAAIQMgACABKAAANgAAIAEgAzYAACACQQFrIQIgAUEEaiEBIABBBGohAAwBCwsLOQECfyAAIAIQiQEgACgCCCEDIAJBFGwiBARAIAAoAgQgA0EUbGogASAE/AoAAAsgACACIANqNgIICzIBAX8gAiADEDEiBARAIAMgASABIANLGyIDBEAgBCAAIAP8CgAACyAAIAIgARA1CyAECzgAAkAgAkGAgMQARg0AIAAgAiABKAIQEQEARQ0AQQEPCyADRQRAQQAPCyAAIANBACABKAIMEQMACy8AAkAgAWlBAUcNACAAQYCAgIB4IAFrSw0AIAAEQCABIAAQMSIBRQ0BCyABDwsACy0BAX8gASAAKAIATwR/IAAoAgQhAiAALQAIRQRAIAEgAk0PCyABIAJJBUEACwstACABIANNBEAgACADIAFrNgIEIAAgAiABQQR0ajYCAA8LIAEgAyADIAQQbQALbgEDfyAAKAIAIgMgACgCCCIERgRAIwBBEGsiAiQAIAJBCGogACADQQFBAkEIEB4gAigCCCIDQYGAgIB4RwRAIAIoAgwaIAMQowEACyACQRBqJAALIAAgBEEBajYCCCAAKAIEIARBA3RqIAE3AQALLAAgAiADSQRAIAMgAiACIAQQbQALIAAgAiADazYCBCAAIAEgA0EUbGo2AgALMwEBfyABKAIAIgJBBk8EQEEAIAJBBkGIl8QAEG0ACyAAIAJBAWo2AgQgACABQQRqNgIACzIBAX8gACgCCCICIAAoAgBGBEAgABBnCyAAIAJBAWo2AgggACgCBCACQQJ0aiABNgIACy4AAkAgA2lBAUcNACABQYCAgIB4IANrSw0AIAAgASADIAIQcyIARQ0AIAAPCwALLgEBfyMAQRBrIgIkACACQQhqIAEgABCPASACKAIIIgBFBEAACyACQRBqJAAgAAstAANAIAEEQCAAKAIAIABBBGooAgBBBEEUEEkgAUEBayEBIABBEGohAAwBCwsLMgEBfyAAKAIIIQIgASAAKAIAQQJqLQAAEJYBIQEgACgCBCACIAEQASAAIAJBAWo2AggLKgAgACAAKAJoIAFqIgEgACgCnAEiAEEBayAAIAFLG0EAIAFBAE4bNgJoCzMBAn8gACAAKAKoASICIAAoAqwBQQFqIgMgASAAQbIBahAyIAAoAmAgACgCZCACIAMQVgszAQJ/IAAgACgCqAEiAiAAKAKsAUEBaiIDIAEgAEGyAWoQGyAAKAJgIAAoAmQgAiADEFYLKgAgASACSQRAQbCdxABBI0HUncQAEG4ACyACIAAgAkEUbGogASACaxAUCzUAIAAgACkCdDcCaCAAIAApAXw3AbIBIAAgAC8BhgE7Ab4BIABBugFqIABBhAFqLwEAOwEAC+wBAgJ/AX4jAEEQayICJAAgAkEBOwEMIAIgATYCCCACIAA2AgQjAEEQayIBJAAgAkEEaiIAKQIAIQQgASAANgIMIAEgBDcCBCMAQRBrIgAkACABQQRqIgEoAgAiAigCDCEDAkACQAJAAkAgAigCBA4CAAECCyADDQFBASECQQAhAwwCCyADDQAgAigCACICKAIEIQMgAigCACECDAELIABBgICAgHg2AgAgACABNgIMIAEoAggiAS0ACRogAEEbIAEtAAgQTQALIAAgAzYCBCAAIAI2AgAgASgCCCIBLQAJGiAAQRwgAS0ACBBNAAsrAQJ/AkAgACgCBCAAKAIIIgEQMCICRQ0AIAEgAkkNACAAIAEgAms2AggLCyYAIAJBIE8EQEEAIAJBICADEG0ACyAAIAE2AgAgACACQQFqNgIECyMBAX8gACgCACAAKAIIIgJrIAFJBEAgACACIAFBBEEQEGoLCyMBAX8gACgCACAAKAIIIgJrIAFJBEAgACACIAFBBEEUEGoLCyUAIABBATYCBCAAIAEoAgQgASgCAGtBBHYiATYCCCAAIAE2AgALGwAgASACTQRAIAIgASADEEoACyAAIAJBFGxqCyAAIAEgAk0EQCACIAFBqJzEABBKAAsgACACakEBOgAACxsAIAEgAk0EQCACIAEgAxBKAAsgACACQQR0agsDAAALHQAgAgRAIAEgAhAxIQELIAAgAjYCBCAAIAE2AgALAwAACwMAAAsDAAALAwAACwMAAAshACAARQRAQdSnxABBMhCsAQALIAAgAiADIAEoAhARAgALFgAgAUEBcUUEQCAAuBAKDwsgAK0QCQtGAQF/IAAgACgCAEEBayIBNgIAIAFFBEAgAEEMahBEAkAgAEF/Rg0AIAAgACgCBEEBayIBNgIEIAENACAAQQRBnAYQNQsLCx8AIABFBEBB1KfEAEEyEKwBAAsgACACIAEoAhARAQALHwEBfyAAKAIQIgEgACgCFBB+IAAoAgwgAUEEQRAQSQsfAQF/IAAoAgQiASAAKAIIEH4gACgCACABQQRBEBBJCxYAIABBEGoQLyAAKAIAIAAoAgQQngELFAAgACAAKAIAQQFrNgIAIAEQlwELEQBBBCAAEDEiAEUEQAALIAALGAAgAEGAgICAeEcEQCAAIAFBBEEUEEkLCxMAIAEoAgQaIABB0KTEACABEBcLDwAgAQRAIAAgAiABEDULCxMAIAAEQA8LQcDjxABBGxCsAQALDwAgAEGEAU8EQCAAEAMLCz4AIAAEQAALIwBBIGsiACQAIABBADYCGCAAQQE2AgwgAEGwjcQANgIIIABCBDcCECAAQQhqQbiNxAAQhQEACxQAIAAoAgAgASAAKAIEKAIMEQEACxAAIAEgACgCBCAAKAIIEBILEgAgACABQbCUxAAQX0EBOgAMCxQAIABBADYCCCAAQoCAgIAQNwIACxAAIAEgACgCACAAKAIEEBILDgBBhKbEAEErIAAQbgALCwAgACMAaiQAIwALDgBB2+PEAEHPABCsAQALCQAgACABEAcACw0AIAFBhKfEAEEYEBILDAAgACABKQIANwMACwoAIAAoAgAQogELCAAgACABEFQLDQAgAEGAgICAeDYCAAsNACAAQYCAgIB4NgIACwkAIABBADYCAAsGACAAEC8LBAAgAQsFAEGABAsEAEEACwQAQQELC6+CASEAQfvHwAALBAEBAQEAQYDKwAALgAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQBBsMzAAAsBAQBB5czAAAsBAQBBoc3AAAsBAQBBgNDAAAuAAgEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAQdjWwAALAQEAQYDAwwALCwEBAQEBAQEBAQEBAEGgwcMACwQBAQEBAEGwwcMACygBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEAAQEBAQEBAQEBAQEBAEGAxMMAC6oBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAQYDGwwAL5AEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAQfrLwwALvgEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAEGAzsMAC/ADAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQBB4NTDAAu/AwEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQBBgNrDAAuCDQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAQYDowwALtAIBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQBBgIDEAAvFHC92YXIvaG9tZS9oaC8uY2FyZ28vcmVnaXN0cnkvc3JjL2luZGV4LmNyYXRlcy5pby0xOTQ5Y2Y4YzZiNWI1NTdmL2F2dC0wLjE2LjAvc3JjL3Rlcm1pbmFsL2RpcnR5X2xpbmVzLnJzAC92YXIvaG9tZS9oaC8uY2FyZ28vcmVnaXN0cnkvc3JjL2luZGV4LmNyYXRlcy5pby0xOTQ5Y2Y4YzZiNWI1NTdmL3VuaWNvZGUtd2lkdGgtMC4xLjE0L3NyYy90YWJsZXMucnMAL3J1c3RjL2RlZDVjMDZjZjIxZDJiOTNiZmZkNWQ4ODRhYTZlOTY5MzRlZTQyMzQvbGlicmFyeS9zdGQvc3JjL3N5cy90aHJlYWRfbG9jYWwvbm9fdGhyZWFkcy5ycwAvdmFyL2hvbWUvaGgvLmNhcmdvL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3Zi9hdnQtMC4xNi4wL3NyYy90YWJzLnJzAC92YXIvaG9tZS9oaC8uY2FyZ28vcmVnaXN0cnkvc3JjL2luZGV4LmNyYXRlcy5pby0xOTQ5Y2Y4YzZiNWI1NTdmL2F2dC0wLjE2LjAvc3JjL3BhcnNlci5ycwAvdmFyL2hvbWUvaGgvLmNhcmdvL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3Zi9hdnQtMC4xNi4wL3NyYy9idWZmZXIucnMAL3Zhci9ob21lL2hoLy5jYXJnby9yZWdpc3RyeS9zcmMvaW5kZXguY3JhdGVzLmlvLTE5NDljZjhjNmI1YjU1N2YvYXZ0LTAuMTYuMC9zcmMvdGVybWluYWwucnMAL3Zhci9ob21lL2hoLy5jYXJnby9yZWdpc3RyeS9zcmMvaW5kZXguY3JhdGVzLmlvLTE5NDljZjhjNmI1YjU1N2Yvd2FzbS1iaW5kZ2VuLTAuMi4xMDYvc3JjL2V4dGVybnJlZi5ycwAvdmFyL2hvbWUvaGgvLmNhcmdvL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3Zi9hdnQtMC4xNi4wL3NyYy9saW5lLnJzAC9ydXN0L2RlcHMvaGFzaGJyb3duLTAuMTUuNS9zcmMvcmF3L21vZC5ycwAvcnVzdGMvZGVkNWMwNmNmMjFkMmI5M2JmZmQ1ZDg4NGFhNmU5NjkzNGVlNDIzNC9saWJyYXJ5L2NvcmUvc3JjL3NsaWNlL21vZC5ycwBsaWJyYXJ5L2FsbG9jL3NyYy9yYXdfdmVjL21vZC5ycwAvcnVzdGMvZGVkNWMwNmNmMjFkMmI5M2JmZmQ1ZDg4NGFhNmU5NjkzNGVlNDIzNC9saWJyYXJ5L2FsbG9jL3NyYy92ZWMvbW9kLnJzAC92YXIvaG9tZS9oaC8uY2FyZ28vcmVnaXN0cnkvc3JjL2luZGV4LmNyYXRlcy5pby0xOTQ5Y2Y4YzZiNWI1NTdmL3NlcmRlLXdhc20tYmluZGdlbi0w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VVVVVVVVVVVVVVUVAABVVVFVVVVVVQUQAAABAVBVVVVVVVVVVVVVAVVVVVVV/////39VVVVQVQAAVVVVVVVVVVVVVQUAQYCvxAALmARAVVVVVVVVVVVVVVVVVUVUAQBUUQEAVVUFVVVVVVVVVVFVVVVVVVVVVVVVVVVVVUQBVFVRVRVVVQVVVVVVVVVFQVVVVVVVVVVVVVVVVVVVVEEVFFBRVVVVVVVVVVBRVVVBVVVVVVVVVVVVVVVVVVVUARBUUVVVVVUFVVVVVVUFAFFVVVVVVVVVVVVVVVVVVQQBVFVRVQFVVQVVVVVVVVVVRVVVVVVVVVVVVVVVVVVVRVRVVVFVFVVVVVVVVVVVVVVUVFVVVVVVVVVVVVVVVVUEVAUEUFVBVVUFVVVVVVVVVVFVVVVVVVVVVVVVVVVVVRREBQRQVUFVVQVVVVVVVVVVUFVVVVVVVVVVVVVVVVUVRAFUVUFVFVVVBVVVVVVVVVVRVVVVVVVVVVVVVVVVVVVVVVVFFQVEVRVVVVVVVVVVVVVVVVVVVVVVVVVVVVEAQFVVFQBAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUQAAVFVVAEBVVVVVVVVVVVVVVVVVVVVVVVVQVVVVVVVVEVFVVVVVVVVVVVVVVVVVAQAAQAAEVQEAAAEAAAAAAAAAAFRVRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUBBABBQVVVVVVVVVAFVFVVVQFUVVVFQVVRVVVVUVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqgBBwLPEAAuQA1VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAVVVVVVVVVVVVVVVVQVUVVVVVVVVBVVVVVVVVVUFVVVVVVVVVQVVVVV///33//3XX3fW1ddVEABQVUUBAABVV1FVVVVVVVVVVVVVFQBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUFVVVVVVVVVVVFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUAVVFVFVQFVVVVVVVVVVVVVVVVVVVVVVVVVVVVXFRRVVVVVVVVVVVVVVVVVVUUAQEQBAFQVAAAUVVVVVVVVVVVVVVVVAAAAAAAAAEBVVVVVVVVVVVVVVVUAVVVVVVVVVVVVVVVVAABQBVVVVVVVVVVVVRUAAFVVVVBVVVVVVVVVBVAQUFVVVVVVVVVVVVVVVVVFUBFQVVVVVVVVVVVVVVVVVVUAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUAAAAAEAFRRVVRQVVVVVVVVVVVVVVVVVVVVVVUAQeC2xAALkwhVVRUAVVVVVVVVBUBVVVVVVVVVVVVVVVUAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAAAAAAAAAABUVVVVVVVVVVVV9VVVVWlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf1X11VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV9VVVVVVVfVVVVVVVVVVVVVVVV////VVVVVVVVVVVVVdVVVVVV1VVVVV1V9VVVVVV9VV9VdVVXVVVVVXVV9V11XVVd9VVVVVVVVVVXVVVVVVVVVVV31d9VVVVVVVVVVVVVVVVVVVX9VVVVVVVVV1VV1VVVVVVVVVVVVVVVVVVVVVVVVVVVVVXVV1VVVVVVVVVVVVVVVVddVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRVQVVVVVVVVVVVVVVVVVVVV/f///////////////19V1VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUAAAAAAAAAAKqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqVVVVqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpaVVVVVVVVqqqqqqqqqqqqqqqqqqoKAKqqqmqpqqqqqqqqqqqqqqqqqqqqqqqqqqpqgaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpVqaqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqKqqqqqqqqqqqmqqqqqqqqqqqqqqqqqqqqqqqqqqqqpVVZWqqqqqqqqqqqqqqmqqqqqqqqqqqqqqVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqVVVVVVVVVVVVVVVVVVVVVaqqqlaqqqqqqqqqqqqqqqqqalVVVVVVVVVVVVVVVVVfVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFUAAAFBVVVVVVVVVBVVVVVVVVVVVVVVVVVVVVVVVVVVVUFVVVUVFFVVVVVVVVUFVVFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQVVVVVVVVAAAAAFBVRRVVVVVVVVVVVVUFAFBVVVVVVRUAAFBVVVWqqqqqqqqqVkBVVVVVVVVVVVVVVRUFUFBVVVVVVVVVVVVRVVVVVVVVVVVVVVVVVVVVVQFAQUFVVRVVVVRVVVVVVVVVVVVVVVRVVVVVVVVVVVVVVVUEFFQFUVVVVVVVVVVVVVVQVUVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRVFFVVVVVqqqqqqqqqqqqVVVVAAAAAABAFQBB/77EAAvhDFVVVVVVVVVVRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQAAAPCqqlpVAAAAAKqqqqqqqqqqaqqqqqpqqlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRWpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpWVVVVVVVVVVVVVVVVVVUFVFVVVVVVVVVVVVVVVVVVVapqVVUAAFRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVBUBVAUFVAFVVVVVVVVVVVVVAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQVVVVVVVVdVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFVRVVVVVVVVVVVVVVVVVVVVVVVVVAVVVVVVVVVVVVVVVVVVVVVVVBQAAVFVVVVVVVVVVVVVVBVBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRVVVVVVVVVVVVVVVVVQAAAEBVVVVVVVVVVVVVFFRVFVBVVVVVVVVVVVVVVRVAQVVFVVVVVVVVVVVVVVVVVVVVQFVVVVVVVVVVFQABAFRVVVVVVVVVVVVVVVVVVRVVVVVQVVVVVVVVVVVVVVVVBQBABVUBFFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFVAEVUVRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVFQBAVVVVVVVQVVVVVVVVVVVVVVVVVRVEVFVVVVUVVVVVBQBUAFRVVVVVVVVVVVVVVVVVVVVVAAAFRFVVVVVVRVVVVVVVVVVVVVVVVVVVVVVVVVVVFABEEQRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRUFUFUQVFVVVVVVVVBVVVVVVVVVVVVVVVVVVVVVVVVVVRUAQBFUVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRVRABBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAQUQAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFQAAQVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFUVBBFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUABVVUVVVVVVVVVQEAQFVVVVVVVVVVVRUABEBVFVVVAUABVVVVVVVVVVVVVQAAAABAUFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUAQAAQVVVVVVVVVVVVVVVVVVVVVVVVVVUFAAAAAAAFAARBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAUBFEAAAVVVVVVVVVVVVVVVVVVVVVVVVUBFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVVFVVQFVVVVVVVVVVVVVVVQVAVURVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVBUAAABQVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUAVFVVVVVVVVVVVVVVVVVVAEBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFVVVVVVVVVVVVVVVVVVVVRVAVVVVVVVVVVVVVVVVVVVVVVVVVapUVVVaVVVVqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqpaVVVVVVVVVVVVVaqqVlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVaqpqmmqqqqqqqqqqmpVVVVlVVVVVVVVVWpZVVVVqlVVqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpVVVVVVVVVVUEAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUAQevLxAALdVAAAAAAAEBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVURUAUAAAAAQAEAVVVVVVVVVQVQVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVBVRVVVVVVVVVVVVVVVVVVQBB7czEAAsCQBUAQfvMxAALxQZUVVFVVVVUVVVVVRUAAQAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVAEAAAAAAFAAQBEBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRVVVVVVVVVVVVVVVVVVVVQBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQBAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAEBVVVVVVVVVVVVVVVVVVVdVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV1VVVVVVVVVVVVVVVVVVVVXX9/39VVVVVVVVVVVVVVVVVVVVVVVX1////////blVVVaqquqqqqqrq+r+/VaqqVlVfVVVVqlpVVVVVVVX//////////1dVVf3/3///////////////////////9///////VVVV/////////////3/V/1VVVf////9XV///////////////////////f/f/////////////////////////////////////////////////////////////1////////////////////19VVdV/////////VVVVVXVVVVVVVVV9VVVVV1VVVVVVVVVVVVVVVVVVVVVVVVVV1f///////////////////////////1VVVVVVVVVVVVVVVf//////////////////////X1VXf/1V/1VV1VdV//9XVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV////VVdVVVVVVVX//////////////3///9//////////////////////////////////////////////////////////////VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf///1f//1dV///////////////f/19V9f///1X//1dV//9XVaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpaVVVVVVVVVVVZllVhqqVZqlVVVVVVlVVVVVVVVVWVVVUAQc7TxAALAQMAQdzTxAALhRFVVVVVVZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRUAlmpaWmqqBUCmWZVlVVVVVVVVVVUAAAAAVVZVValWVVVVVVVVVVVVVlVVVVVVVVVVAAAAAAAAAABUVVVVlVlZVVVlVVVpVVVVVVVVVVVVVVWVVpVqqqqqVaqqWlVVVVlVqqqqVVVVVWVVVVpVVVVVpWVWVVVVlVVVVVVVVaaWmpZZWWWplqqqZlWqVVpZVVpWZVVVVWqqpaVaVVVVpapaVVVZWVVVWVVVVVVVlVVVVVVVVVVVVVVVVVVVVVVVVVVVZVX1VVVVaVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqVaqqqqqqqqqqqlVVVaqqqqqlWlVVmqpaVaWlVVpapZalWlVVVaVaVZVVVVV9VWlZpVVfVWZVVVVVVVVVVWZV////VVVVmppqmlVVVdVVVVVV1VVVpV1V9VVVVVW9Va+quqqrqqqaVbqq+q66rlVd9VVVVVVVVVVXVVVVVVlVVVV31d9VVVVVVVVVpaqqVVVVVVVV1VdVVVVVVVVVVVVVVVVXrVpVVVVVVVVVVVWqqqqqqqqqaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqgAAAMCqqlpVAAAAAKqqqqqqqqqqaqqqqqpqqlVVVVVVVVVVVVVVVQVUVVVVVVVVVVVVVVVVVVVVqmpVVQAAVFmqqmpVqqqqqqqqqlqqqqqqqqqqqqqqqqqqqlpVqqqqqqqqqrr+/7+qqqqqVlVVVVVVVVVVVVVVVVX1////////AAECAgICAwICBAIFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdAgIeAgICAgICAh8gISIjAiQlJicoKQIqAgICAissAgICAi0uAgICLzAxMjMCAgICAgI0AgI1NjcCODk6Ozw9Pj85OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTlAOTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OUECAkJDAgJERUZHSEkCSjk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OUsCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI5OTk5TAICAgICTU5PUAICAlECUlMCAgICAgICAgICAgICVFUCAlYCVwICWFlaW1xdXl9gYQJiYwJkZWZnAmgCaWprbAICbW5vcAJxcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcwICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnR1AgICAgICAnZ3OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTl4OTk5OTk5OTk5eXoCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAns5OXw5OX0CAgICAgICAgICAgICAgICAgICfgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAn8CAgKAgYICAgICAgICAgICAgICAgKDhAICAgICAgICAgKFhnUCAocCAgKIAgICAgICAomKAgICAgICAgICAgICAouMAo2OAo+QkZKTlJWWApcCApiZmpsCAgICAgICAgICOTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5nB0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAnQICAgKenwIEAgUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0CAh4CAgICAgICHyAhIiMCJCUmJygpAioCAgICoKGio6Slpi6nqKmqq6ytMwICAgICAq4CAjU2NwI4OTo7PD0+rzk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OUwCAgICArBOT7GFhnUCAocCAgKIAgICAgICAomKAgICAgICAgICAgICAouMsrOOAo+QkZKTlJWWApcCApiZmpsCAgICAgICAgICbnVsbCBwb2ludGVyIHBhc3NlZCB0byBydXN0cmVjdXJzaXZlIHVzZSBvZiBhbiBvYmplY3QgZGV0ZWN0ZWQgd2hpY2ggd291bGQgbGVhZCB0byB1bnNhZmUgYWxpYXNpbmcgaW4gcnVzdEpzVmFsdWUoKQAqMhEACAAAADIyEQABAAAAmQIRAGcAAAB/AAAAEQAAAJkCEQBnAAAAjAAAABEAQeTkxAALAQQASAlwcm9kdWNlcnMBDHByb2Nlc3NlZC1ieQIGd2FscnVzBjAuMjQuNAx3YXNtLWJpbmRnZW4TMC4yLjEwNiAoMTE4MzFmYjg5KQ==");

  async function init(options) {
                      await __wbg_init({
                          module_or_path: await options.module,
                          memory: options.memory,
                      });
                      return exports$1;
                  }

  class Clock {
    constructor() {
      let speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1.0;
      this.speed = speed;
      this.startTime = performance.now();
    }
    getTime() {
      return this.speed * (performance.now() - this.startTime) / 1000.0;
    }
    setTime(time) {
      this.startTime = performance.now() - time / this.speed * 1000.0;
    }
  }
  class NullClock {
    constructor() {}
    getTime(_speed) {}
    setTime(_time) {}
  }

  // Efficient array transformations without intermediate array objects.
  // Inspired by Elixir's streams and Rust's iterator adapters.

  class Stream {
    constructor(input, xfs) {
      this.input = typeof input.next === "function" ? input : input[Symbol.iterator]();
      this.xfs = xfs ?? [];
    }
    map(f) {
      return this.transform(Map$1(f));
    }
    flatMap(f) {
      return this.transform(FlatMap(f));
    }
    filter(f) {
      return this.transform(Filter(f));
    }
    take(n) {
      return this.transform(Take(n));
    }
    drop(n) {
      return this.transform(Drop(n));
    }
    transform(f) {
      return new Stream(this.input, this.xfs.concat([f]));
    }
    multiplex(other, comparator) {
      return new Stream(new Multiplexer(this[Symbol.iterator](), other[Symbol.iterator](), comparator));
    }
    toArray() {
      return Array.from(this);
    }
    [Symbol.iterator]() {
      let v = 0;
      let values = [];
      let flushed = false;
      const xf = compose(this.xfs, val => values.push(val));
      return {
        next: () => {
          if (v === values.length) {
            values = [];
            v = 0;
          }
          while (values.length === 0) {
            const next = this.input.next();
            if (next.done) {
              break;
            } else {
              xf.step(next.value);
            }
          }
          if (values.length === 0 && !flushed) {
            xf.flush();
            flushed = true;
          }
          if (values.length > 0) {
            return {
              done: false,
              value: values[v++]
            };
          } else {
            return {
              done: true
            };
          }
        }
      };
    }
  }
  function Map$1(f) {
    return emit => {
      return input => {
        emit(f(input));
      };
    };
  }
  function FlatMap(f) {
    return emit => {
      return input => {
        f(input).forEach(emit);
      };
    };
  }
  function Filter(f) {
    return emit => {
      return input => {
        if (f(input)) {
          emit(input);
        }
      };
    };
  }
  function Take(n) {
    let c = 0;
    return emit => {
      return input => {
        if (c < n) {
          emit(input);
        }
        c += 1;
      };
    };
  }
  function Drop(n) {
    let c = 0;
    return emit => {
      return input => {
        c += 1;
        if (c > n) {
          emit(input);
        }
      };
    };
  }
  function compose(xfs, push) {
    return xfs.reverse().reduce((next, curr) => {
      const xf = toXf(curr(next.step));
      return {
        step: xf.step,
        flush: () => {
          xf.flush();
          next.flush();
        }
      };
    }, toXf(push));
  }
  function toXf(xf) {
    if (typeof xf === "function") {
      return {
        step: xf,
        flush: () => {}
      };
    } else {
      return xf;
    }
  }
  class Multiplexer {
    constructor(left, right, comparator) {
      this.left = left;
      this.right = right;
      this.comparator = comparator;
    }
    [Symbol.iterator]() {
      let leftItem;
      let rightItem;
      return {
        next: () => {
          if (leftItem === undefined && this.left !== undefined) {
            const result = this.left.next();
            if (result.done) {
              this.left = undefined;
            } else {
              leftItem = result.value;
            }
          }
          if (rightItem === undefined && this.right !== undefined) {
            const result = this.right.next();
            if (result.done) {
              this.right = undefined;
            } else {
              rightItem = result.value;
            }
          }
          if (leftItem === undefined && rightItem === undefined) {
            return {
              done: true
            };
          } else if (leftItem === undefined) {
            const value = rightItem;
            rightItem = undefined;
            return {
              done: false,
              value: value
            };
          } else if (rightItem === undefined) {
            const value = leftItem;
            leftItem = undefined;
            return {
              done: false,
              value: value
            };
          } else if (this.comparator(leftItem, rightItem)) {
            const value = leftItem;
            leftItem = undefined;
            return {
              done: false,
              value: value
            };
          } else {
            const value = rightItem;
            rightItem = undefined;
            return {
              done: false,
              value: value
            };
          }
        }
      };
    }
  }

  async function parse$2(data) {
    if (data instanceof Response) {
      const text = await data.text();
      const result = parseJsonl(text);
      if (result !== undefined) {
        const {
          header,
          events
        } = result;
        if (header.version === 2) {
          return parseAsciicastV2(header, events);
        } else if (header.version === 3) {
          return parseAsciicastV3(header, events);
        } else {
          throw new Error(`asciicast v${header.version} format not supported`);
        }
      } else {
        const header = JSON.parse(text);
        if (header.version === 1) {
          return parseAsciicastV1(header);
        }
      }
    } else if (typeof data === "object" && data.version === 1) {
      return parseAsciicastV1(data);
    } else if (Array.isArray(data)) {
      const header = data[0];
      if (header.version === 2) {
        const events = data.slice(1, data.length);
        return parseAsciicastV2(header, events);
      } else if (header.version === 3) {
        const events = data.slice(1, data.length);
        return parseAsciicastV3(header, events);
      } else {
        throw new Error(`asciicast v${header.version} format not supported`);
      }
    }
    throw new Error("invalid data");
  }
  function parseJsonl(jsonl) {
    const lines = jsonl.split("\n");
    let header;
    try {
      header = JSON.parse(lines[0]);
    } catch (_error) {
      return;
    }
    const events = new Stream(lines).drop(1).filter(l => l[0] === "[").map(JSON.parse);
    return {
      header,
      events
    };
  }
  function parseAsciicastV1(data) {
    let time = 0;
    const events = new Stream(data.stdout).map(e => {
      time += e[0];
      return [time, "o", e[1]];
    });
    return {
      cols: data.width,
      rows: data.height,
      events
    };
  }
  function parseAsciicastV2(header, events) {
    return {
      cols: header.width,
      rows: header.height,
      theme: parseTheme$1(header.theme),
      events,
      idleTimeLimit: header.idle_time_limit
    };
  }
  function parseAsciicastV3(header, events) {
    if (!(events instanceof Stream)) {
      events = new Stream(events);
    }
    let time = 0;
    events = events.map(e => {
      time += e[0];
      return [time, e[1], e[2]];
    });
    return {
      cols: header.term.cols,
      rows: header.term.rows,
      theme: parseTheme$1(header.term?.theme),
      events,
      idleTimeLimit: header.idle_time_limit
    };
  }
  function parseTheme$1(theme) {
    if (theme === undefined) return;
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    const paletteRegex = /^(#[0-9A-Fa-f]{6}:){7,}#[0-9A-Fa-f]{6}$/;
    const fg = theme?.fg;
    const bg = theme?.bg;
    const palette = theme?.palette;
    if (colorRegex.test(fg) && colorRegex.test(bg) && paletteRegex.test(palette)) {
      return {
        foreground: fg,
        background: bg,
        palette: palette.split(":")
      };
    }
  }
  function unparseAsciicastV2(recording) {
    const header = JSON.stringify({
      version: 2,
      width: recording.cols,
      height: recording.rows
    });
    const events = recording.events.map(JSON.stringify).join("\n");
    return `${header}\n${events}\n`;
  }

  var asciicast = /*#__PURE__*/Object.freeze({
      __proto__: null,
      default: parse$2,
      parse: parse$2,
      unparseAsciicastV2: unparseAsciicastV2
  });

  function recording(src, _ref, _ref2) {
    let {
      feed,
      resize,
      onInput,
      onMarker,
      setState,
      logger
    } = _ref;
    let {
      speed,
      idleTimeLimit,
      startAt,
      loop,
      posterTime,
      markers: markers_,
      pauseOnMarkers,
      cols: initialCols,
      rows: initialRows,
      audioUrl
    } = _ref2;
    let cols;
    let rows;
    let events;
    let markers;
    let duration;
    let effectiveStartAt;
    let eventTimeoutId;
    let nextEventIndex = 0;
    let lastEventTime = 0;
    let startTime;
    let pauseElapsedTime;
    let playCount = 0;
    let waitingForAudio = false;
    let waitingTimeout;
    let shouldResumeOnAudioPlaying = false;
    let now = () => performance.now() * speed;
    let audioCtx;
    let audioElement;
    let audioSeekable = false;
    async function init() {
      const timeout = setTimeout(() => {
        setState("loading");
      }, 3000);
      try {
        let metadata = loadRecording(src, logger, {
          idleTimeLimit,
          startAt,
          markers_
        });
        const hasAudio = await loadAudio(audioUrl);
        metadata = await metadata;
        return {
          ...metadata,
          hasAudio
        };
      } finally {
        clearTimeout(timeout);
      }
    }
    async function loadRecording(src, logger, opts) {
      const {
        parser,
        minFrameTime,
        inputOffset,
        dumpFilename,
        encoding = "utf-8"
      } = src;
      const data = await doFetch(src);
      const recording = prepare(await parser(data, {
        encoding
      }), logger, {
        ...opts,
        minFrameTime,
        inputOffset
      });
      ({
        cols,
        rows,
        events,
        duration,
        effectiveStartAt
      } = recording);
      initialCols = initialCols ?? cols;
      initialRows = initialRows ?? rows;
      if (events.length === 0) {
        throw new Error("recording is missing events");
      }
      if (dumpFilename !== undefined) {
        dump(recording, dumpFilename);
      }
      const poster = posterTime !== undefined ? getPoster(posterTime) : undefined;
      markers = events.filter(e => e[1] === "m").map(e => [e[0], e[2].label]);
      return {
        cols,
        rows,
        duration,
        theme: recording.theme,
        poster,
        markers
      };
    }
    async function loadAudio(audioUrl) {
      if (!audioUrl) return false;
      audioElement = await createAudioElement(audioUrl);
      audioSeekable = !Number.isNaN(audioElement.duration) && audioElement.duration !== Infinity && audioElement.seekable.length > 0 && audioElement.seekable.end(audioElement.seekable.length - 1) === audioElement.duration;
      if (audioSeekable) {
        audioElement.addEventListener("playing", onAudioPlaying);
        audioElement.addEventListener("waiting", onAudioWaiting);
      } else {
        logger.warn(`audio is not seekable - you must enable range request support on the server providing ${audioElement.src} for audio seeking to work`);
      }
      return true;
    }
    async function doFetch(_ref3) {
      let {
        url,
        data,
        fetchOpts = {}
      } = _ref3;
      if (typeof url === "string") {
        return await doFetchOne(url, fetchOpts);
      } else if (Array.isArray(url)) {
        return await Promise.all(url.map(url => doFetchOne(url, fetchOpts)));
      } else if (data !== undefined) {
        if (typeof data === "function") {
          data = data();
        }
        if (!(data instanceof Promise)) {
          data = Promise.resolve(data);
        }
        const value = await data;
        if (typeof value === "string" || value instanceof ArrayBuffer) {
          return new Response(value);
        } else {
          return value;
        }
      } else {
        throw new Error("failed fetching recording file: url/data missing in src");
      }
    }
    async function doFetchOne(url, fetchOpts) {
      const response = await fetch(url, fetchOpts);
      if (!response.ok) {
        throw new Error(`failed fetching recording from ${url}: ${response.status} ${response.statusText}`);
      }
      return response;
    }
    function scheduleNextEvent() {
      const nextEvent = events[nextEventIndex];
      if (nextEvent) {
        eventTimeoutId = scheduleAt(runNextEvent, nextEvent[0]);
      } else {
        onEnd();
      }
    }
    function scheduleAt(f, targetTime) {
      let timeout = (targetTime * 1000 - (now() - startTime)) / speed;
      if (timeout < 0) {
        timeout = 0;
      }
      return setTimeout(f, timeout);
    }
    function runNextEvent() {
      let event = events[nextEventIndex];
      let elapsedWallTime;
      do {
        lastEventTime = event[0];
        nextEventIndex++;
        const stop = executeEvent(event);
        if (stop) {
          return;
        }
        event = events[nextEventIndex];
        elapsedWallTime = now() - startTime;
      } while (event && elapsedWallTime > event[0] * 1000);
      scheduleNextEvent();
    }
    function cancelNextEvent() {
      clearTimeout(eventTimeoutId);
      eventTimeoutId = null;
    }
    function executeEvent(event) {
      const [time, type, data] = event;
      if (type === "o") {
        feed(data);
      } else if (type === "i") {
        onInput(data);
      } else if (type === "r") {
        const [cols, rows] = data.split("x");
        resize(cols, rows);
      } else if (type === "m") {
        onMarker(data);
        if (pauseOnMarkers) {
          pause();
          pauseElapsedTime = time * 1000;
          setState("idle", {
            reason: "paused"
          });
          return true;
        }
      }
      return false;
    }
    function onEnd() {
      cancelNextEvent();
      playCount++;
      if (loop === true || typeof loop === "number" && playCount < loop) {
        nextEventIndex = 0;
        startTime = now();
        feed("\x1bc"); // reset terminal
        resizeTerminalToInitialSize();
        scheduleNextEvent();
        if (audioElement) {
          audioElement.currentTime = 0;
        }
      } else {
        pauseElapsedTime = duration * 1000;
        setState("ended");
        if (audioElement) {
          audioElement.pause();
        }
      }
    }
    async function play() {
      if (eventTimeoutId) throw new Error("already playing");
      if (events[nextEventIndex] === undefined) throw new Error("already ended");
      if (effectiveStartAt !== null) {
        seek(effectiveStartAt);
      }
      await resume();
      return true;
    }
    function pause() {
      shouldResumeOnAudioPlaying = false;
      if (audioElement) {
        audioElement.pause();
      }
      if (!eventTimeoutId) return true;
      cancelNextEvent();
      pauseElapsedTime = now() - startTime;
      return true;
    }
    async function resume() {
      if (audioElement && !audioCtx) setupAudioCtx();
      startTime = now() - pauseElapsedTime;
      pauseElapsedTime = null;
      scheduleNextEvent();
      if (audioElement) {
        await audioElement.play();
      }
    }
    async function seek(where) {
      if (waitingForAudio) {
        return false;
      }
      const isPlaying = !!eventTimeoutId;
      pause();
      if (audioElement) {
        audioElement.pause();
      }
      const currentTime = (pauseElapsedTime ?? 0) / 1000;
      if (typeof where === "string") {
        if (where === "<<") {
          where = currentTime - 5;
        } else if (where === ">>") {
          where = currentTime + 5;
        } else if (where === "<<<") {
          where = currentTime - 0.1 * duration;
        } else if (where === ">>>") {
          where = currentTime + 0.1 * duration;
        } else if (where[where.length - 1] === "%") {
          where = parseFloat(where.substring(0, where.length - 1)) / 100 * duration;
        }
      } else if (typeof where === "object") {
        if (where.marker === "prev") {
          where = findMarkerTimeBefore(currentTime) ?? 0;
          if (isPlaying && currentTime - where < 1) {
            where = findMarkerTimeBefore(where) ?? 0;
          }
        } else if (where.marker === "next") {
          where = findMarkerTimeAfter(currentTime) ?? duration;
        } else if (typeof where.marker === "number") {
          const marker = markers[where.marker];
          if (marker === undefined) {
            throw new Error(`invalid marker index: ${where.marker}`);
          } else {
            where = marker[0];
          }
        }
      }
      const targetTime = Math.min(Math.max(where, 0), duration);
      if (targetTime * 1000 === pauseElapsedTime) return false;
      if (targetTime < lastEventTime) {
        feed("\x1bc"); // reset terminal
        resizeTerminalToInitialSize();
        nextEventIndex = 0;
        lastEventTime = 0;
      }
      let event = events[nextEventIndex];
      while (event && event[0] <= targetTime) {
        if (event[1] === "o" || event[1] === "r") {
          executeEvent(event);
        }
        lastEventTime = event[0];
        event = events[++nextEventIndex];
      }
      pauseElapsedTime = targetTime * 1000;
      effectiveStartAt = null;
      if (audioElement && audioSeekable) {
        audioElement.currentTime = targetTime / speed;
      }
      if (isPlaying) {
        await resume();
      } else if (events[nextEventIndex] === undefined) {
        onEnd();
      }
      return true;
    }
    function findMarkerTimeBefore(time) {
      if (markers.length == 0) return;
      let i = 0;
      let marker = markers[i];
      let lastMarkerTimeBefore;
      while (marker && marker[0] < time) {
        lastMarkerTimeBefore = marker[0];
        marker = markers[++i];
      }
      return lastMarkerTimeBefore;
    }
    function findMarkerTimeAfter(time) {
      if (markers.length == 0) return;
      let i = markers.length - 1;
      let marker = markers[i];
      let firstMarkerTimeAfter;
      while (marker && marker[0] > time) {
        firstMarkerTimeAfter = marker[0];
        marker = markers[--i];
      }
      return firstMarkerTimeAfter;
    }
    function step(n) {
      if (n === undefined) {
        n = 1;
      }
      let nextEvent;
      let targetIndex;
      if (n > 0) {
        let index = nextEventIndex;
        nextEvent = events[index];
        for (let i = 0; i < n; i++) {
          while (nextEvent !== undefined && nextEvent[1] !== "o") {
            nextEvent = events[++index];
          }
          if (nextEvent !== undefined && nextEvent[1] === "o") {
            targetIndex = index;
          }
        }
      } else {
        let index = Math.max(nextEventIndex - 2, 0);
        nextEvent = events[index];
        for (let i = n; i < 0; i++) {
          while (nextEvent !== undefined && nextEvent[1] !== "o") {
            nextEvent = events[--index];
          }
          if (nextEvent !== undefined && nextEvent[1] === "o") {
            targetIndex = index;
          }
        }
        if (targetIndex !== undefined) {
          feed("\x1bc"); // reset terminal
          resizeTerminalToInitialSize();
          nextEventIndex = 0;
        }
      }
      if (targetIndex === undefined) return;
      while (nextEventIndex <= targetIndex) {
        nextEvent = events[nextEventIndex++];
        if (nextEvent[1] === "o" || nextEvent[1] === "r") {
          executeEvent(nextEvent);
        }
      }
      lastEventTime = nextEvent[0];
      pauseElapsedTime = lastEventTime * 1000;
      effectiveStartAt = null;
      if (audioElement && audioSeekable) {
        audioElement.currentTime = lastEventTime / speed;
      }
      if (events[targetIndex + 1] === undefined) {
        onEnd();
      }
    }
    async function restart() {
      if (eventTimeoutId) throw new Error("still playing");
      if (events[nextEventIndex] !== undefined) throw new Error("not ended");
      seek(0);
      await resume();
      return true;
    }
    function getPoster(time) {
      return events.filter(e => e[0] < time && e[1] === "o").map(e => e[2]);
    }
    function getCurrentTime() {
      if (eventTimeoutId) {
        return (now() - startTime) / 1000;
      } else {
        return (pauseElapsedTime ?? 0) / 1000;
      }
    }
    function resizeTerminalToInitialSize() {
      resize(initialCols, initialRows);
    }
    function setupAudioCtx() {
      audioCtx = new AudioContext({
        latencyHint: "interactive"
      });
      const src = audioCtx.createMediaElementSource(audioElement);
      src.connect(audioCtx.destination);
      now = audioNow;
    }
    function audioNow() {
      if (!audioCtx) throw new Error("audio context not started - can't tell time!");
      const {
        contextTime,
        performanceTime
      } = audioCtx.getOutputTimestamp();

      // The check below is needed for Chrome,
      // which returns 0 for first several dozen millis,
      // completely ruining the timing (the clock jumps backwards once),
      // therefore we initially ignore performanceTime in our calculation.

      return performanceTime === 0 ? contextTime * 1000 : contextTime * 1000 + (performance.now() - performanceTime);
    }
    function onAudioWaiting() {
      logger.debug("audio buffering");
      waitingForAudio = true;
      shouldResumeOnAudioPlaying = !!eventTimeoutId;
      waitingTimeout = setTimeout(() => setState("loading"), 1000);
      if (!eventTimeoutId) return true;
      logger.debug("pausing session playback");
      cancelNextEvent();
      pauseElapsedTime = now() - startTime;
    }
    function onAudioPlaying() {
      logger.debug("audio resumed");
      clearTimeout(waitingTimeout);
      setState("playing");
      if (!waitingForAudio) return;
      waitingForAudio = false;
      if (shouldResumeOnAudioPlaying) {
        logger.debug("resuming session playback");
        startTime = now() - pauseElapsedTime;
        pauseElapsedTime = null;
        scheduleNextEvent();
      }
    }
    function mute() {
      if (audioElement) {
        audioElement.muted = true;
        return true;
      }
    }
    function unmute() {
      if (audioElement) {
        audioElement.muted = false;
        return true;
      }
    }
    return {
      init,
      play,
      pause,
      seek,
      step,
      restart,
      stop: pause,
      mute,
      unmute,
      getCurrentTime
    };
  }
  function batcher(logger) {
    let minFrameTime = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1.0 / 60;
    let prevEvent;
    return emit => {
      let ic = 0;
      let oc = 0;
      return {
        step: event => {
          ic++;
          if (prevEvent === undefined) {
            prevEvent = event;
            return;
          }
          if (event[1] === "o" && prevEvent[1] === "o" && event[0] - prevEvent[0] < minFrameTime) {
            prevEvent[2] += event[2];
          } else {
            emit(prevEvent);
            prevEvent = event;
            oc++;
          }
        },
        flush: () => {
          if (prevEvent !== undefined) {
            emit(prevEvent);
            oc++;
          }
          logger.debug(`batched ${ic} frames to ${oc} frames`);
        }
      };
    };
  }
  function prepare(recording, logger, _ref4) {
    let {
      startAt = 0,
      idleTimeLimit,
      minFrameTime,
      inputOffset,
      markers_
    } = _ref4;
    let {
      events
    } = recording;
    if (!(events instanceof Stream)) {
      events = new Stream(events);
    }
    idleTimeLimit = idleTimeLimit ?? recording.idleTimeLimit ?? Infinity;
    const limiterOutput = {
      offset: 0
    };
    events = events.transform(batcher(logger, minFrameTime)).map(timeLimiter(idleTimeLimit, startAt, limiterOutput)).map(markerWrapper());
    if (markers_ !== undefined) {
      markers_ = new Stream(markers_).map(normalizeMarker);
      events = events.filter(e => e[1] !== "m").multiplex(markers_, (a, b) => a[0] < b[0]).map(markerWrapper());
    }
    events = events.toArray();
    if (inputOffset !== undefined) {
      events = events.map(e => e[1] === "i" ? [e[0] + inputOffset, e[1], e[2]] : e);
      events.sort((a, b) => a[0] - b[0]);
    }
    const duration = events[events.length - 1][0];
    const effectiveStartAt = startAt - limiterOutput.offset;
    return {
      ...recording,
      events,
      duration,
      effectiveStartAt
    };
  }
  function normalizeMarker(m) {
    return typeof m === "number" ? [m, "m", ""] : [m[0], "m", m[1]];
  }
  function timeLimiter(idleTimeLimit, startAt, output) {
    let prevT = 0;
    let shift = 0;
    return function (e) {
      const delay = e[0] - prevT;
      const delta = delay - idleTimeLimit;
      prevT = e[0];
      if (delta > 0) {
        shift += delta;
        if (e[0] < startAt) {
          output.offset += delta;
        }
      }
      return [e[0] - shift, e[1], e[2]];
    };
  }
  function markerWrapper() {
    let i = 0;
    return function (e) {
      if (e[1] === "m") {
        return [e[0], e[1], {
          index: i++,
          time: e[0],
          label: e[2]
        }];
      } else {
        return e;
      }
    };
  }
  function dump(recording, filename) {
    const link = document.createElement("a");
    const events = recording.events.map(e => e[1] === "m" ? [e[0], e[1], e[2].label] : e);
    const asciicast = unparseAsciicastV2({
      ...recording,
      events
    });
    link.href = URL.createObjectURL(new Blob([asciicast], {
      type: "text/plain"
    }));
    link.download = filename;
    link.click();
  }
  async function createAudioElement(src) {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.loop = false;
    audio.crossOrigin = "anonymous";
    let resolve;
    const canPlay = new Promise(resolve_ => {
      resolve = resolve_;
    });
    function onCanPlay() {
      resolve();
      audio.removeEventListener("canplay", onCanPlay);
    }
    audio.addEventListener("canplay", onCanPlay);
    audio.src = src;
    audio.load();
    await canPlay;
    return audio;
  }

  function clock(_ref, _ref2, _ref3) {
    let {
      hourColor = 3,
      minuteColor = 4,
      separatorColor = 9
    } = _ref;
    let {
      feed
    } = _ref2;
    let {
      cols = 5,
      rows = 1
    } = _ref3;
    const middleRow = Math.floor(rows / 2);
    const leftPad = Math.floor(cols / 2) - 2;
    const setupCursor = `\x1b[?25l\x1b[1m\x1b[${middleRow}B`;
    let intervalId;
    const getCurrentTime = () => {
      const d = new Date();
      const h = d.getHours();
      const m = d.getMinutes();
      const seqs = [];
      seqs.push("\r");
      for (let i = 0; i < leftPad; i++) {
        seqs.push(" ");
      }
      seqs.push(`\x1b[3${hourColor}m`);
      if (h < 10) {
        seqs.push("0");
      }
      seqs.push(`${h}`);
      seqs.push(`\x1b[3${separatorColor};5m:\x1b[25m`);
      seqs.push(`\x1b[3${minuteColor}m`);
      if (m < 10) {
        seqs.push("0");
      }
      seqs.push(`${m}`);
      return seqs;
    };
    const updateTime = () => {
      getCurrentTime().forEach(feed);
    };
    return {
      init: () => {
        const duration = 24 * 60;
        const poster = [setupCursor].concat(getCurrentTime());
        return {
          cols,
          rows,
          duration,
          poster
        };
      },
      play: () => {
        feed(setupCursor);
        updateTime();
        intervalId = setInterval(updateTime, 1000);
        return true;
      },
      stop: () => {
        clearInterval(intervalId);
      },
      getCurrentTime: () => {
        const d = new Date();
        return d.getHours() * 60 + d.getMinutes();
      }
    };
  }

  function random(src, _ref, _ref2) {
    let {
      feed
    } = _ref;
    let {
      speed
    } = _ref2;
    const base = " ".charCodeAt(0);
    const range = "~".charCodeAt(0) - base;
    let timeoutId;
    const schedule = () => {
      const t = Math.pow(5, Math.random() * 4);
      timeoutId = setTimeout(print, t / speed);
    };
    const print = () => {
      schedule();
      const char = String.fromCharCode(base + Math.floor(Math.random() * range));
      feed(char);
    };
    return () => {
      schedule();
      return () => clearInterval(timeoutId);
    };
  }

  function benchmark(_ref, _ref2) {
    let {
      url,
      iterations = 10
    } = _ref;
    let {
      feed,
      setState
    } = _ref2;
    let data;
    let byteCount = 0;
    return {
      async init() {
        const recording = await parse$2(await fetch(url));
        const {
          cols,
          rows,
          events
        } = recording;
        data = Array.from(events).filter(_ref3 => {
          let [_time, type, _text] = _ref3;
          return type === "o";
        }).map(_ref4 => {
          let [time, _type, text] = _ref4;
          return [time, text];
        });
        const duration = data[data.length - 1][0];
        for (const [_, text] of data) {
          byteCount += new Blob([text]).size;
        }
        return {
          cols,
          rows,
          duration
        };
      },
      play() {
        const startTime = performance.now();
        for (let i = 0; i < iterations; i++) {
          for (const [_, text] of data) {
            feed(text);
          }
          feed("\x1bc"); // reset terminal
        }

        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000;
        const throughput = byteCount * iterations / duration;
        const throughputMbs = byteCount / (1024 * 1024) * iterations / duration;
        console.info("benchmark: result", {
          byteCount,
          iterations,
          duration,
          throughput,
          throughputMbs
        });
        setTimeout(() => {
          setState("stopped", {
            reason: "ended"
          });
        }, 0);
        return true;
      }
    };
  }

  class Queue {
    constructor() {
      this.items = [];
      this.onPush = undefined;
    }
    push(item) {
      this.items.push(item);
      if (this.onPush !== undefined) {
        this.onPush(this.popAll());
        this.onPush = undefined;
      }
    }
    popAll() {
      if (this.items.length > 0) {
        const items = this.items;
        this.items = [];
        return items;
      } else {
        const thiz = this;
        return new Promise(resolve => {
          thiz.onPush = resolve;
        });
      }
    }
  }

  function getBuffer(bufferTime, feed, resize, onInput, onMarker, setTime, baseStreamTime, minFrameTime, logger) {
    const execute = executeEvent(feed, resize, onInput, onMarker);
    if (bufferTime === 0) {
      logger.debug("using no buffer");
      return nullBuffer(execute);
    } else {
      bufferTime = bufferTime ?? {};
      let getBufferTime;
      if (typeof bufferTime === "number") {
        logger.debug(`using fixed time buffer (${bufferTime} ms)`);
        getBufferTime = _latency => bufferTime;
      } else if (typeof bufferTime === "function") {
        logger.debug("using custom dynamic buffer");
        getBufferTime = bufferTime({
          logger
        });
      } else {
        logger.debug("using adaptive buffer", bufferTime);
        getBufferTime = adaptiveBufferTimeProvider({
          logger
        }, bufferTime);
      }
      return buffer(getBufferTime, execute, setTime, logger, baseStreamTime ?? 0.0, minFrameTime);
    }
  }
  function nullBuffer(execute) {
    return {
      pushEvent(event) {
        execute(event[1], event[2]);
      },
      pushText(text) {
        execute("o", text);
      },
      stop() {}
    };
  }
  function executeEvent(feed, resize, onInput, onMarker) {
    return function (code, data) {
      if (code === "o") {
        feed(data);
      } else if (code === "i") {
        onInput(data);
      } else if (code === "r") {
        resize(data.cols, data.rows);
      } else if (code === "m") {
        onMarker(data);
      }
    };
  }
  function buffer(getBufferTime, execute, setTime, logger, baseStreamTime) {
    let minFrameTime = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1.0 / 60;
    let epoch = performance.now() - baseStreamTime * 1000;
    let bufferTime = getBufferTime(0);
    const queue = new Queue();
    minFrameTime *= 1000;
    let prevElapsedStreamTime = -minFrameTime;
    let stop = false;
    function elapsedWallTime() {
      return performance.now() - epoch;
    }
    setTimeout(async () => {
      while (!stop) {
        const events = await queue.popAll();
        if (stop) return;
        for (const event of events) {
          const elapsedStreamTime = event[0] * 1000 + bufferTime;
          if (elapsedStreamTime - prevElapsedStreamTime < minFrameTime) {
            execute(event[1], event[2]);
            continue;
          }
          const delay = elapsedStreamTime - elapsedWallTime();
          if (delay > 0) {
            await sleep(delay);
            if (stop) return;
          }
          setTime(event[0]);
          execute(event[1], event[2]);
          prevElapsedStreamTime = elapsedStreamTime;
        }
      }
    }, 0);
    return {
      pushEvent(event) {
        let latency = elapsedWallTime() - event[0] * 1000;
        if (latency < 0) {
          logger.debug(`correcting epoch by ${latency} ms`);
          epoch += latency;
          latency = 0;
        }
        bufferTime = getBufferTime(latency);
        queue.push(event);
      },
      pushText(text) {
        queue.push([elapsedWallTime() / 1000, "o", text]);
      },
      stop() {
        stop = true;
        queue.push(undefined);
      }
    };
  }
  function sleep(t) {
    return new Promise(resolve => {
      setTimeout(resolve, t);
    });
  }
  function adaptiveBufferTimeProvider() {
    let {
      logger
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    let {
      minBufferTime = 50,
      bufferLevelStep = 100,
      maxBufferLevel = 50,
      transitionDuration = 500,
      peakHalfLifeUp = 100,
      peakHalfLifeDown = 10000,
      floorHalfLifeUp = 5000,
      floorHalfLifeDown = 100,
      idealHalfLifeUp = 1000,
      idealHalfLifeDown = 5000,
      safetyMultiplier = 1.2,
      minImprovementDuration = 3000
    } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    function levelToMs(level) {
      return level === 0 ? minBufferTime : bufferLevelStep * level;
    }
    let bufferLevel = 1;
    let bufferTime = levelToMs(bufferLevel);
    let lastUpdateTime = performance.now();
    let smoothedPeakLatency = null;
    let smoothedFloorLatency = null;
    let smoothedIdealBufferTime = null;
    let stableSince = null;
    let targetBufferTime = null;
    let transitionRate = null;
    return function (latency) {
      const now = performance.now();
      const dt = Math.max(0, now - lastUpdateTime);
      lastUpdateTime = now;

      // adjust EMA-smoothed peak latency from current latency

      if (smoothedPeakLatency === null) {
        smoothedPeakLatency = latency;
      } else if (latency > smoothedPeakLatency) {
        const alphaUp = 1 - Math.pow(2, -dt / peakHalfLifeUp);
        smoothedPeakLatency += alphaUp * (latency - smoothedPeakLatency);
      } else {
        const alphaDown = 1 - Math.pow(2, -dt / peakHalfLifeDown);
        smoothedPeakLatency += alphaDown * (latency - smoothedPeakLatency);
      }
      smoothedPeakLatency = Math.max(smoothedPeakLatency, 0);

      // adjust EMA-smoothed floor latency from current latency

      if (smoothedFloorLatency === null) {
        smoothedFloorLatency = latency;
      } else if (latency > smoothedFloorLatency) {
        const alphaUp = 1 - Math.pow(2, -dt / floorHalfLifeUp);
        smoothedFloorLatency += alphaUp * (latency - smoothedFloorLatency);
      } else {
        const alphaDown = 1 - Math.pow(2, -dt / floorHalfLifeDown);
        smoothedFloorLatency += alphaDown * (latency - smoothedFloorLatency);
      }
      smoothedFloorLatency = Math.max(smoothedFloorLatency, 0);

      // adjust EMA-smoothed ideal buffer time

      const jitter = smoothedPeakLatency - smoothedFloorLatency;
      const idealBufferTime = safetyMultiplier * (smoothedPeakLatency + jitter);
      if (smoothedIdealBufferTime === null) {
        smoothedIdealBufferTime = idealBufferTime;
      } else if (idealBufferTime > smoothedIdealBufferTime) {
        const alphaUp = 1 - Math.pow(2, -dt / idealHalfLifeUp);
        smoothedIdealBufferTime += +alphaUp * (idealBufferTime - smoothedIdealBufferTime);
      } else {
        const alphaDown = 1 - Math.pow(2, -dt / idealHalfLifeDown);
        smoothedIdealBufferTime += +alphaDown * (idealBufferTime - smoothedIdealBufferTime);
      }

      // quantize smoothed ideal buffer time to discrete buffer level

      let newBufferLevel;
      if (smoothedIdealBufferTime <= minBufferTime) {
        newBufferLevel = 0;
      } else {
        newBufferLevel = clamp(Math.ceil(smoothedIdealBufferTime / bufferLevelStep), 1, maxBufferLevel);
      }
      if (latency > bufferTime) {
        logger.debug('buffer underrun', {
          latency,
          bufferTime
        });
      }

      // adjust buffer level and target buffer time for new buffer level

      if (newBufferLevel > bufferLevel) {
        if (latency > bufferTime) {
          // <- underrun - raise quickly
          bufferLevel = Math.min(newBufferLevel, bufferLevel + 3);
        } else {
          bufferLevel += 1;
        }
        targetBufferTime = levelToMs(bufferLevel);
        transitionRate = (targetBufferTime - bufferTime) / transitionDuration;
        stableSince = null;
        logger.debug('raising buffer', {
          latency,
          bufferTime,
          targetBufferTime
        });
      } else if (newBufferLevel < bufferLevel) {
        if (stableSince == null) stableSince = now;
        if (now - stableSince >= minImprovementDuration) {
          bufferLevel -= 1;
          targetBufferTime = levelToMs(bufferLevel);
          transitionRate = (targetBufferTime - bufferTime) / transitionDuration;
          stableSince = now;
          logger.debug('lowering buffer', {
            latency,
            bufferTime,
            targetBufferTime
          });
        }
      } else {
        stableSince = null;
      }

      // linear transition to target buffer time

      if (targetBufferTime !== null) {
        bufferTime += transitionRate * dt;
        if (transitionRate >= 0 && bufferTime > targetBufferTime || transitionRate < 0 && bufferTime < targetBufferTime) {
          bufferTime = targetBufferTime;
          targetBufferTime = null;
        }
      }
      return bufferTime;
    };
  }
  function clamp(x, lo, hi) {
    return Math.min(hi, Math.max(lo, x));
  }

  const ONE_SEC_IN_USEC = 1000000;
  function alisHandler(logger) {
    const outputDecoder = new TextDecoder();
    const inputDecoder = new TextDecoder();
    let handler = parseMagicString;
    let lastEventTime;
    let markerIndex = 0;
    function parseMagicString(buffer) {
      const text = new TextDecoder().decode(buffer);
      if (text === "ALiS\x01") {
        handler = parseFirstFrame;
      } else {
        throw new Error("not an ALiS v1 live stream");
      }
    }
    function parseFirstFrame(buffer) {
      const view = new BinaryReader(new DataView(buffer));
      const type = view.getUint8();
      if (type !== 0x01) throw new Error(`expected reset (0x01) frame, got ${type}`);
      return parseResetFrame(view, buffer);
    }
    function parseResetFrame(view, buffer) {
      view.decodeVarUint();
      let time = view.decodeVarUint();
      lastEventTime = time;
      time = time / ONE_SEC_IN_USEC;
      markerIndex = 0;
      const cols = view.decodeVarUint();
      const rows = view.decodeVarUint();
      const themeFormat = view.getUint8();
      let theme;
      if (themeFormat === 8) {
        const len = (2 + 8) * 3;
        theme = parseTheme(new Uint8Array(buffer, view.offset, len));
        view.forward(len);
      } else if (themeFormat === 16) {
        const len = (2 + 16) * 3;
        theme = parseTheme(new Uint8Array(buffer, view.offset, len));
        view.forward(len);
      } else if (themeFormat !== 0) {
        throw new Error(`alis: invalid theme format (${themeFormat})`);
      }
      const initLen = view.decodeVarUint();
      let init;
      if (initLen > 0) {
        init = outputDecoder.decode(new Uint8Array(buffer, view.offset, initLen));
      }
      handler = parseFrame;
      return {
        time,
        term: {
          size: {
            cols,
            rows
          },
          theme,
          init
        }
      };
    }
    function parseFrame(buffer) {
      const view = new BinaryReader(new DataView(buffer));
      const type = view.getUint8();
      if (type === 0x01) {
        return parseResetFrame(view, buffer);
      } else if (type === 0x6f) {
        return parseOutputFrame(view, buffer);
      } else if (type === 0x69) {
        return parseInputFrame(view, buffer);
      } else if (type === 0x72) {
        return parseResizeFrame(view);
      } else if (type === 0x6d) {
        return parseMarkerFrame(view, buffer);
      } else if (type === 0x04) {
        // EOT
        handler = parseFirstFrame;
        return false;
      } else {
        logger.debug(`alis: unknown frame type: ${type}`);
      }
    }
    function parseOutputFrame(view, buffer) {
      view.decodeVarUint();
      const relTime = view.decodeVarUint();
      lastEventTime += relTime;
      const len = view.decodeVarUint();
      const text = outputDecoder.decode(new Uint8Array(buffer, view.offset, len));
      return [lastEventTime / ONE_SEC_IN_USEC, "o", text];
    }
    function parseInputFrame(view, buffer) {
      view.decodeVarUint();
      const relTime = view.decodeVarUint();
      lastEventTime += relTime;
      const len = view.decodeVarUint();
      const text = inputDecoder.decode(new Uint8Array(buffer, view.offset, len));
      return [lastEventTime / ONE_SEC_IN_USEC, "i", text];
    }
    function parseResizeFrame(view) {
      view.decodeVarUint();
      const relTime = view.decodeVarUint();
      lastEventTime += relTime;
      const cols = view.decodeVarUint();
      const rows = view.decodeVarUint();
      return [lastEventTime / ONE_SEC_IN_USEC, "r", {
        cols,
        rows
      }];
    }
    function parseMarkerFrame(view, buffer) {
      view.decodeVarUint();
      const relTime = view.decodeVarUint();
      lastEventTime += relTime;
      const len = view.decodeVarUint();
      const decoder = new TextDecoder();
      const index = markerIndex++;
      const time = lastEventTime / ONE_SEC_IN_USEC;
      const label = decoder.decode(new Uint8Array(buffer, view.offset, len));
      return [time, "m", {
        index,
        time,
        label
      }];
    }
    return function (buffer) {
      return handler(buffer);
    };
  }
  function parseTheme(arr) {
    const colorCount = arr.length / 3;
    const foreground = hexColor(arr[0], arr[1], arr[2]);
    const background = hexColor(arr[3], arr[4], arr[5]);
    const palette = [];
    for (let i = 2; i < colorCount; i++) {
      palette.push(hexColor(arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2]));
    }
    return {
      foreground,
      background,
      palette
    };
  }
  function hexColor(r, g, b) {
    return `#${byteToHex(r)}${byteToHex(g)}${byteToHex(b)}`;
  }
  function byteToHex(value) {
    return value.toString(16).padStart(2, "0");
  }
  class BinaryReader {
    constructor(inner) {
      let offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      this.inner = inner;
      this.offset = offset;
    }
    forward(delta) {
      this.offset += delta;
    }
    getUint8() {
      const value = this.inner.getUint8(this.offset);
      this.offset += 1;
      return value;
    }
    decodeVarUint() {
      let number = BigInt(0);
      let shift = BigInt(0);
      let byte = this.getUint8();
      while (byte > 127) {
        byte &= 127;
        number += BigInt(byte) << shift;
        shift += BigInt(7);
        byte = this.getUint8();
      }
      number = number + (BigInt(byte) << shift);
      return Number(number);
    }
  }

  function ascicastV2Handler() {
    let parse = parseHeader;
    function parseHeader(buffer) {
      const header = JSON.parse(buffer);
      if (header.version !== 2) {
        throw new Error("not an asciicast v2 stream");
      }
      parse = parseEvent;
      return {
        time: 0.0,
        term: {
          size: {
            cols: header.width,
            rows: header.height
          }
        }
      };
    }
    function parseEvent(buffer) {
      const event = JSON.parse(buffer);
      if (event[1] === "r") {
        const [cols, rows] = event[2].split("x");
        return [event[0], "r", {
          cols: parseInt(cols, 10),
          rows: parseInt(rows, 10)
        }];
      } else {
        return event;
      }
    }
    return function (buffer) {
      return parse(buffer);
    };
  }

  function ascicastV3Handler() {
    let parse = parseHeader;
    let currentTime = 0;
    function parseHeader(buffer) {
      const header = JSON.parse(buffer);
      if (header.version !== 3) {
        throw new Error("not an asciicast v3 stream");
      }
      parse = parseEvent;
      const term = {
        size: {
          cols: header.term.cols,
          rows: header.term.rows
        }
      };
      if (header.term.theme) {
        term.theme = {
          foreground: header.term.theme.fg,
          background: header.term.theme.bg,
          palette: header.term.theme.palette.split(":")
        };
      }
      return {
        time: 0.0,
        term
      };
    }
    function parseEvent(buffer) {
      const event = JSON.parse(buffer);
      const [interval, eventType, data] = event;
      currentTime += interval;
      if (eventType === "r") {
        const [cols, rows] = data.split("x");
        return [currentTime, "r", {
          cols: parseInt(cols, 10),
          rows: parseInt(rows, 10)
        }];
      } else {
        return [currentTime, eventType, data];
      }
    }
    return function (buffer) {
      return parse(buffer);
    };
  }

  function rawHandler() {
    const outputDecoder = new TextDecoder();
    let parse = parseSize;
    function parseSize(buffer) {
      const text = outputDecoder.decode(buffer, {
        stream: true
      });
      const [cols, rows] = sizeFromResizeSeq(text) ?? sizeFromScriptStartMessage(text) ?? [80, 24];
      parse = parseOutput;
      return {
        time: 0.0,
        term: {
          size: {
            cols,
            rows
          },
          init: text
        }
      };
    }
    function parseOutput(buffer) {
      return outputDecoder.decode(buffer, {
        stream: true
      });
    }
    return function (buffer) {
      return parse(buffer);
    };
  }
  function sizeFromResizeSeq(text) {
    const match = text.match(/\x1b\[8;(\d+);(\d+)t/);
    if (match !== null) {
      return [parseInt(match[2], 10), parseInt(match[1], 10)];
    }
  }
  function sizeFromScriptStartMessage(text) {
    const match = text.match(/\[.*COLUMNS="(\d{1,3})" LINES="(\d{1,3})".*\]/);
    if (match !== null) {
      return [parseInt(match[1], 10), parseInt(match[2], 10)];
    }
  }

  const RECONNECT_DELAY_BASE = 500;
  const RECONNECT_DELAY_CAP = 10000;
  function exponentialDelay(attempt) {
    const base = Math.min(RECONNECT_DELAY_BASE * Math.pow(2, attempt), RECONNECT_DELAY_CAP);
    return Math.random() * base;
  }
  function websocket(_ref, _ref2, _ref3) {
    let {
      url,
      bufferTime,
      reconnectDelay = exponentialDelay,
      minFrameTime
    } = _ref;
    let {
      feed,
      reset,
      resize,
      onInput,
      onMarker,
      setState,
      logger
    } = _ref2;
    let {
      audioUrl
    } = _ref3;
    logger = new PrefixedLogger(logger, "websocket: ");
    let socket;
    let buf;
    let clock = new NullClock();
    let reconnectAttempt = 0;
    let successfulConnectionTimeout;
    let stop = false;
    let wasOnline = false;
    let initTimeout;
    let audioElement;
    function connect() {
      socket = new WebSocket(url, ["v1.alis", "v2.asciicast", "v3.asciicast", "raw"]);
      socket.binaryType = "arraybuffer";
      socket.onopen = () => {
        const proto = socket.protocol || "raw";
        logger.info("opened");
        logger.info(`activating ${proto} protocol handler`);
        if (proto === "v1.alis") {
          socket.onmessage = onMessage(alisHandler(logger));
        } else if (proto === "v2.asciicast") {
          socket.onmessage = onMessage(ascicastV2Handler());
        } else if (proto === "v3.asciicast") {
          socket.onmessage = onMessage(ascicastV3Handler());
        } else if (proto === "raw") {
          socket.onmessage = onMessage(rawHandler());
        }
        successfulConnectionTimeout = setTimeout(() => {
          reconnectAttempt = 0;
        }, 1000);
      };
      socket.onclose = event => {
        clearTimeout(initTimeout);
        stopBuffer();
        if (stop || event.code === 1000 || event.code === 1005) {
          logger.info("closed");
          setState("ended", {
            message: "Stream ended"
          });
        } else if (event.code === 1002) {
          logger.debug(`close reason: ${event.reason}`);
          setState("ended", {
            message: "Err: Player not compatible with the server"
          });
        } else {
          clearTimeout(successfulConnectionTimeout);
          const delay = reconnectDelay(reconnectAttempt++);
          logger.info(`unclean close, reconnecting in ${delay}...`);
          setState("loading");
          setTimeout(connect, delay);
        }
      };
      wasOnline = false;
    }
    function onMessage(handler) {
      initTimeout = setTimeout(onStreamEnd, 5000);
      return function (event) {
        try {
          const result = handler(event.data);
          if (buf) {
            if (Array.isArray(result)) {
              buf.pushEvent(result);
            } else if (typeof result === "string") {
              buf.pushText(result);
            } else if (typeof result === "object" && !Array.isArray(result)) {
              // TODO: check last event ID from the parser, don't reset if we didn't miss anything
              onStreamReset(result);
            } else if (result === false) {
              // EOT
              onStreamEnd();
            } else if (result !== undefined) {
              throw new Error(`unexpected value from protocol handler: ${result}`);
            }
          } else {
            if (typeof result === "object" && !Array.isArray(result)) {
              onStreamReset(result);
              clearTimeout(initTimeout);
            } else if (result === undefined) {
              clearTimeout(initTimeout);
              initTimeout = setTimeout(onStreamEnd, 1000);
            } else {
              clearTimeout(initTimeout);
              throw new Error(`unexpected value from protocol handler: ${result}`);
            }
          }
        } catch (e) {
          socket.close();
          throw e;
        }
      };
    }
    function onStreamReset(_ref4) {
      let {
        time,
        term
      } = _ref4;
      const {
        size,
        init,
        theme
      } = term;
      const {
        cols,
        rows
      } = size;
      logger.info(`stream reset (${cols}x${rows} @${time})`);
      setState("playing");
      stopBuffer();
      buf = getBuffer(bufferTime, feed, resize, onInput, onMarker, t => clock.setTime(t), time, minFrameTime, logger);
      reset(cols, rows, init, theme);
      clock = new Clock();
      wasOnline = true;
      if (typeof time === "number") {
        clock.setTime(time);
      }
    }
    function onStreamEnd() {
      stopBuffer();
      if (wasOnline) {
        logger.info("stream ended");
        setState("offline", {
          message: "Stream ended"
        });
      } else {
        logger.info("stream offline");
        setState("offline", {
          message: "Stream offline"
        });
      }
      clock = new NullClock();
    }
    function stopBuffer() {
      if (buf) buf.stop();
      buf = null;
    }
    function startAudio() {
      if (!audioUrl) return;
      audioElement = new Audio();
      audioElement.preload = "auto";
      audioElement.crossOrigin = "anonymous";
      audioElement.src = audioUrl;
      audioElement.play();
    }
    function stopAudio() {
      if (!audioElement) return;
      audioElement.pause();
    }
    function mute() {
      if (audioElement) {
        audioElement.muted = true;
        return true;
      }
    }
    function unmute() {
      if (audioElement) {
        audioElement.muted = false;
        return true;
      }
    }
    return {
      init: () => {
        return {
          hasAudio: !!audioUrl
        };
      },
      play: () => {
        connect();
        startAudio();
      },
      stop: () => {
        stop = true;
        stopBuffer();
        if (socket !== undefined) socket.close();
        stopAudio();
      },
      mute,
      unmute,
      getCurrentTime: () => clock.getTime()
    };
  }

  function eventsource(_ref, _ref2) {
    let {
      url,
      bufferTime,
      minFrameTime
    } = _ref;
    let {
      feed,
      reset,
      resize,
      onInput,
      onMarker,
      setState,
      logger
    } = _ref2;
    logger = new PrefixedLogger(logger, "eventsource: ");
    let es;
    let buf;
    let clock = new NullClock();
    function initBuffer(baseStreamTime) {
      if (buf !== undefined) buf.stop();
      buf = getBuffer(bufferTime, feed, resize, onInput, onMarker, t => clock.setTime(t), baseStreamTime, minFrameTime, logger);
    }
    return {
      play: () => {
        es = new EventSource(url);
        es.addEventListener("open", () => {
          logger.info("opened");
          initBuffer();
        });
        es.addEventListener("error", e => {
          logger.info("errored");
          logger.debug({
            e
          });
          setState("loading");
        });
        es.addEventListener("message", event => {
          const e = JSON.parse(event.data);
          if (Array.isArray(e)) {
            buf.pushEvent(e);
          } else if (e.cols !== undefined || e.width !== undefined) {
            const cols = e.cols ?? e.width;
            const rows = e.rows ?? e.height;
            logger.debug(`vt reset (${cols}x${rows})`);
            setState("playing");
            initBuffer(e.time);
            reset(cols, rows, e.init ?? undefined);
            clock = new Clock();
            if (typeof e.time === "number") {
              clock.setTime(e.time);
            }
          } else if (e.state === "offline") {
            logger.info("stream offline");
            setState("offline", {
              message: "Stream offline"
            });
            clock = new NullClock();
          }
        });
        es.addEventListener("done", () => {
          logger.info("closed");
          es.close();
          setState("ended", {
            message: "Stream ended"
          });
        });
      },
      stop: () => {
        if (buf !== undefined) buf.stop();
        if (es !== undefined) es.close();
      },
      getCurrentTime: () => clock.getTime()
    };
  }

  /**
   * DVR driver - hybrid driver combining live WebSocket streaming with DVR playback
   *
   * This driver enables "time-shifted viewing" of live streams:
   * - Starts in live mode (WebSocket connection)
   * - Switches to DVR mode when user seeks or pauses
   * - DVR mode loads the .cast file from the server for scrubbing
   * - User can return to live with goLive()
   *
   * Usage:
   *   AsciinemaPlayer.create({
   *     driver: 'dvr',
   *     wsUrl: 'wss://example.com/ws/s/TOKEN',
   *     castUrl: 'https://example.com/s/TOKEN/cast'
   *   }, container, options);
   */

  function dvr(_ref, callbacks, opts) {
    let {
      wsUrl,
      castUrl,
      bufferTime,
      reconnectDelay,
      minFrameTime
    } = _ref;
    const {
      feed,
      reset,
      resize,
      onInput,
      onMarker,
      setState,
      setMetadata,
      logger: baseLogger
    } = callbacks;
    const logger = new PrefixedLogger(baseLogger, "dvr: ");
    let mode = 'live'; // 'live' | 'dvr'
    let wsDriver = null;
    let recDriver = null;
    let lastKnownTime = 0;
    let metadata = null;
    let switchingToDvr = false; // Flag to suppress WS "Stream ended" during DVR switch

    // Growing timeline state: tracks when DVR mode was entered and actual fetched content
    let dvrStartTime = null; // performance.now() when switched to DVR mode
    let fetchedDuration = null; // Duration of content actually fetched from .cast file
    let durationUpdateTimer = null; // Timer to update duration for growing timeline

    // Fix 4: Seek queuing to prevent race conditions during rapid dragging
    let seekInProgress = false;
    let pendingSeek = null;

    // Fix 3: goLive timeout tracking
    let goLiveTimeoutId = null;

    /**
     * Get estimated duration for visual timeline growth.
     *
     * While in DVR mode, the timeline should grow in real-time to show the stream
     * is still live, even though we've only fetched content up to fetchedDuration.
     *
     * @returns {number} Estimated duration in seconds
     */
    function getEstimatedDuration() {
      if (mode !== 'dvr' || !dvrStartTime || !fetchedDuration) {
        return metadata?.duration || 0;
      }

      // Duration grows in real-time based on elapsed time since DVR switch
      const elapsedSinceDvr = (performance.now() - dvrStartTime) / 1000;
      return fetchedDuration + elapsedSinceDvr;
    }

    /**
     * Get metadata with estimated duration for timeline UI.
     * This is called by core.js to get duration for rendering.
     */
    function getMetadata() {
      if (mode === 'dvr') {
        return {
          ...metadata,
          duration: getEstimatedDuration(),
          // Growing duration for timeline
          fetchedDuration: fetchedDuration // Actual fetched content duration
        };
      }

      return metadata;
    }

    /**
     * Start the duration update timer for growing timeline visualization.
     * Updates the core's duration every second to make timeline grow.
     */
    function startDurationUpdateTimer() {
      stopDurationUpdateTimer(); // Clear any existing timer

      durationUpdateTimer = setInterval(() => {
        if (mode === 'dvr' && setMetadata) {
          const newDuration = getEstimatedDuration();
          setMetadata({
            duration: newDuration
          });
          logger.debug(`timeline duration updated to ${newDuration.toFixed(1)}s`);
        }
      }, 1000); // Update every second

      logger.info('started duration update timer for growing timeline');
    }

    /**
     * Stop the duration update timer.
     */
    function stopDurationUpdateTimer() {
      if (durationUpdateTimer) {
        clearInterval(durationUpdateTimer);
        durationUpdateTimer = null;
        logger.debug('stopped duration update timer');
      }
    }

    // Callbacks wrapper for WebSocket driver - intercept setState during DVR switch
    const wrappedCallbacks = {
      ...callbacks,
      logger: new PrefixedLogger(baseLogger, "dvr.ws: "),
      setState: (state, data) => {
        // When switching to DVR, suppress offline/ended messages from WebSocket
        if (switchingToDvr && (state === 'offline' || state === 'ended')) {
          logger.info(`suppressing WS ${state} during DVR switch`);
          return;
        }
        callbacks.setState(state, data);
      }
    };
    async function init() {
      logger.info("initializing in live mode");

      // Initialize WebSocket driver for live mode
      wsDriver = websocket({
        url: wsUrl,
        bufferTime,
        reconnectDelay,
        minFrameTime
      }, wrappedCallbacks, opts);
      metadata = await wsDriver.init();
      return {
        ...metadata,
        // DVR mode provides seeking capability
        seekable: true
      };
    }
    async function play() {
      if (mode === 'live') {
        logger.info("playing live");
        return wsDriver.play();
      } else {
        logger.info("playing DVR");
        if (recDriver) {
          try {
            const result = await recDriver.play();
            // Recording driver doesn't set "playing" state for non-audio content
            callbacks.setState('playing', {
              dvrMode: true
            });
            return result;
          } catch (e) {
            if (e.message === 'already ended') {
              logger.info('DVR at live edge, cannot play');
              callbacks.setState('idle', {
                reason: 'paused',
                dvrMode: true,
                atLiveEdge: true
              });
              return false;
            } else if (e.message === 'already playing') {
              // Already playing - this is fine, just return true
              logger.debug('DVR already playing');
              // Still set playing state to ensure UI is correct
              callbacks.setState('playing', {
                dvrMode: true
              });
              return true;
            }
            throw e;
          }
        }
      }
    }
    async function pause() {
      if (mode === 'live') {
        // In live mode, pause switches to DVR mode (without auto-play)
        logger.info("pausing live stream, switching to DVR mode");
        lastKnownTime = wsDriver.getCurrentTime();

        // Set flag to suppress "Stream ended" message from WebSocket during transition
        switchingToDvr = true;
        wsDriver.stop();

        // Switch to DVR mode - pass null for seekTime, we'll seek after with better control
        await switchToDvr(null, false);

        // Now seek to a safe position (before the live edge)
        // Use a larger buffer when pausing to avoid "ended" state
        if (recDriver && metadata && metadata.duration) {
          const safeTime = Math.max(0, Math.min(lastKnownTime, metadata.duration - 2));
          logger.info(`pause: seeking to safe position ${safeTime}s (live was ${lastKnownTime}s, duration ${metadata.duration}s)`);
          await recDriver.seek(safeTime);
        }
        switchingToDvr = false;
        return true;
      } else if (recDriver) {
        return recDriver.pause();
      }
      return true;
    }
    async function seek(where) {
      // Fix 4: If seek already in progress, queue this one (only keep most recent)
      if (seekInProgress) {
        logger.debug(`seek queued: ${where} (previous seek in progress)`);
        pendingSeek = where;
        return 'queued';
      }
      seekInProgress = true;
      try {
        // Fix 5: Normalize percentage strings to absolute time values
        // This must happen BEFORE the fetchedDuration comparison
        // Uses getEstimatedDuration() for growing timeline support
        if (typeof where === "string" && where.endsWith("%")) {
          const pct = parseFloat(where.slice(0, -1)) / 100;
          const duration = getEstimatedDuration();
          where = pct * duration;
          logger.debug(`normalized ${pct * 100}% to ${where.toFixed(2)}s (duration: ${duration.toFixed(2)}s)`);
        }

        // Fix 1: Only show loading spinner when switching FROM live mode
        // Not during normal DVR scrubbing (mode already 'dvr')
        const wasLive = mode === 'live';
        if (wasLive) {
          logger.info(`seeking from live mode to ${where}, switching to DVR`);
          lastKnownTime = wsDriver.getCurrentTime();

          // Show loading only on initial DVR switch
          callbacks.setState('loading');

          // Set flag to suppress "Stream ended" message from WebSocket during transition
          switchingToDvr = true;
          wsDriver.stop();
          // Don't auto-play - we'll seek first, then play
          await switchToDvr(null, false);
          switchingToDvr = false;
        }

        // Lazy refetch: Check if seeking beyond FETCHED content (not estimated)
        // If so, fetch fresh .cast to get any new content
        if (mode === 'dvr' && fetchedDuration && where > fetchedDuration) {
          logger.info(`seek into unfetched zone (${where.toFixed(1)}s > ${fetchedDuration.toFixed(1)}s), refreshing`);

          // Show loading during refetch
          callbacks.setState('loading');

          // Refetch to get latest content
          await refreshRecording();

          // If still beyond fetched content after refresh, clamp to end
          if (where > fetchedDuration) {
            const clampedTime = Math.max(0, fetchedDuration - 0.5);
            logger.info(`still beyond fetched content, clamping ${where.toFixed(1)}s to ${clampedTime.toFixed(1)}s`);
            where = clampedTime;
          }
        }
        if (recDriver) {
          const result = await recDriver.seek(where);

          // Fix 2: Ensure every path ends with a non-loading state
          if (result !== false) {
            try {
              await recDriver.play();
              // Recording driver doesn't set "playing" state for non-audio content,
              // so we need to do it explicitly after successful play()
              callbacks.setState('playing', {
                dvrMode: true
              });
            } catch (e) {
              if (e.message === 'already ended') {
                logger.info('DVR seek reached end, pausing');
                callbacks.setState('idle', {
                  reason: 'paused',
                  dvrMode: true,
                  atLiveEdge: true
                });
                return false;
              } else if (e.message === 'already playing') {
                // Already playing from a previous seek - this is fine during rapid dragging
                logger.debug('DVR already playing, continuing');
                // Still set playing state to clear any loading overlay
                callbacks.setState('playing', {
                  dvrMode: true
                });
              } else {
                // Fix 2: Error fallback - ensure we exit loading state
                logger.error(`DVR play error: ${e.message}`);
                callbacks.setState('idle', {
                  reason: 'error',
                  dvrMode: true
                });
                throw e;
              }
            }
            // Return 'playing' instead of true - core.js only sets 'idle' if result === true
            // This prevents core from overwriting our 'playing' state after auto-play
            return 'playing';
          } else {
            // Fix 2: seek() returned false - already at position
            // Ensure we're not stuck in loading state
            if (mode === 'dvr') {
              callbacks.setState('idle', {
                reason: 'paused',
                dvrMode: true
              });
            }
          }
          return result;
        }
        return false;
      } finally {
        // Fix 4: Process queued seek if any
        seekInProgress = false;
        if (pendingSeek !== null) {
          const nextSeek = pendingSeek;
          pendingSeek = null;
          logger.debug(`processing queued seek: ${nextSeek}`);
          // Use setTimeout to avoid stack overflow on rapid seeks
          setTimeout(() => seek(nextSeek), 0);
        }
      }
    }
    function step(n) {
      if (mode === 'dvr' && recDriver) {
        return recDriver.step(n);
      }
      // Stepping not supported in live mode
      return false;
    }
    async function restart() {
      if (mode === 'dvr' && recDriver) {
        return await recDriver.restart();
      }
      return false;
    }
    function stop() {
      logger.info("stopping");

      // Clean up duration update timer
      stopDurationUpdateTimer();
      if (mode === 'live' && wsDriver) {
        wsDriver.stop();
      } else if (mode === 'dvr' && recDriver) {
        recDriver.stop();
      }
    }
    async function switchToDvr(seekTime) {
      let autoPlay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      if (mode === 'dvr') return true;
      logger.info(`switching to DVR mode${''}${autoPlay ? '' : ' (paused)'}`);
      mode = 'dvr';

      // Only show loading spinner if we're going to auto-play
      // When pausing, we go straight to 'idle' which doesn't need loading UI
      if (autoPlay) {
        callbacks.setState('loading');
      }

      // Create recording driver if not exists
      if (!recDriver) {
        // Build recording source configuration
        const recSrc = {
          url: castUrl,
          parser: (await Promise.resolve().then(function () { return asciicast; })).default
        };

        // Don't use startAt for initial load - we'll seek after
        const recOpts = {
          ...opts,
          startAt: 0
        };
        const recCallbacks = {
          ...callbacks,
          logger: new PrefixedLogger(baseLogger, "dvr.rec: "),
          setState: (state, data) => {
            // Intercept 'ended' state in DVR mode - convert to paused
            // This happens when seeking to the live edge of an active stream
            if (state === 'ended') {
              logger.info("DVR reached end of recording, pausing at live edge");
              callbacks.setState('idle', {
                ...data,
                dvrMode: true,
                reason: 'paused',
                atLiveEdge: true
              });
              return;
            }
            // Pass through other states with DVR mode info
            callbacks.setState(state, {
              ...data,
              dvrMode: true
            });
          }
        };
        recDriver = recording(recSrc, recCallbacks, recOpts);
        try {
          metadata = await recDriver.init();
          logger.info(`DVR loaded: ${metadata.duration}s duration`);

          // Track when we entered DVR and what duration we fetched
          // This enables growing timeline visualization
          dvrStartTime = performance.now();
          fetchedDuration = metadata.duration;

          // Update core with new duration from recording
          if (setMetadata && metadata.duration !== undefined) {
            setMetadata({
              duration: metadata.duration
            });
          }

          // Start timer to update duration every second (growing timeline)
          startDurationUpdateTimer();
        } catch (e) {
          logger.error(`failed to load DVR: ${e.message}`);
          // Fall back to live mode
          mode = 'live';
          recDriver = null;
          callbacks.setState('offline', {
            message: 'DVR unavailable'
          });
          return false;
        }
      }

      // Auto-play in DVR mode (unless pausing)
      if (autoPlay) {
        try {
          await recDriver.play();
          // Recording driver doesn't set "playing" state for non-audio content
          callbacks.setState('playing', {
            dvrMode: true
          });
        } catch (e) {
          if (e.message === 'already ended') {
            // At the live edge of the recording - pause instead
            logger.info('DVR at live edge, pausing');
            callbacks.setState('idle', {
              reason: 'paused',
              dvrMode: true,
              atLiveEdge: true
            });
          } else {
            throw e;
          }
        }
      } else {
        callbacks.setState('idle', {
          reason: 'paused',
          dvrMode: true
        });
      }
      return true;
    }

    /**
     * Refresh the DVR recording to get latest content.
     * Called when user seeks into an unfetched zone (beyond fetchedDuration).
     *
     * @returns {object} Updated metadata with new duration
     */
    async function refreshRecording() {
      logger.info('refreshing DVR recording to get latest content');

      // Remember current position for later
      recDriver ? recDriver.getCurrentTime() : 0;

      // Stop current recording driver
      if (recDriver) {
        recDriver.stop();
        recDriver = null;
      }

      // Fetch fresh .cast file (switchToDvr will create new recDriver)
      // Don't auto-play, don't show loading spinner
      mode = 'live'; // Temporarily set to live so switchToDvr creates new driver
      await switchToDvr(null, false);
      logger.info(`refreshed recording, new fetchedDuration: ${fetchedDuration}s`);
      return metadata;
    }
    async function goLive() {
      if (mode === 'live') {
        logger.debug("already in live mode");
        return true;
      }
      logger.info("returning to live mode");

      // Stop DVR playback
      if (recDriver) {
        recDriver.stop();
        recDriver = null; // Clear so we fetch fresh .cast on next DVR switch
      }

      mode = 'live';

      // Reset DVR timeline tracking (timeline growth stops)
      dvrStartTime = null;
      fetchedDuration = null;
      stopDurationUpdateTimer();

      // Clear duration (live mode has no fixed duration)
      if (setMetadata) {
        setMetadata({
          duration: undefined
        });
      }
      callbacks.setState('loading');

      // Fix 3: Set timeout for reconnection - prevents infinite loading spinner
      const RECONNECT_TIMEOUT_MS = 10000; // 10 seconds
      goLiveTimeoutId = setTimeout(() => {
        logger.warn('goLive timeout - WebSocket reconnection taking too long');
        callbacks.setState('offline', {
          message: 'Reconnection timeout - click to retry'
        });
      }, RECONNECT_TIMEOUT_MS);
      try {
        // Recreate WebSocket driver (it was stopped when we switched to DVR)
        wsDriver = websocket({
          url: wsUrl,
          bufferTime,
          reconnectDelay,
          minFrameTime
        }, wrappedCallbacks, opts);
        await wsDriver.init();
        await wsDriver.play();

        // Clear timeout on success
        clearTimeout(goLiveTimeoutId);
        goLiveTimeoutId = null;
        return true;
      } catch (e) {
        // Fix 3: Clear timeout and show offline on error
        clearTimeout(goLiveTimeoutId);
        goLiveTimeoutId = null;
        logger.error(`goLive failed: ${e.message}`);
        callbacks.setState('offline', {
          message: 'Failed to reconnect to live stream'
        });
        return false;
      }
    }
    function getCurrentTime() {
      if (mode === 'live' && wsDriver) {
        return wsDriver.getCurrentTime();
      } else if (mode === 'dvr' && recDriver) {
        return recDriver.getCurrentTime();
      }
      return lastKnownTime;
    }
    function getMode() {
      return mode;
    }
    function mute() {
      if (mode === 'live' && wsDriver && wsDriver.mute) {
        return wsDriver.mute();
      } else if (mode === 'dvr' && recDriver && recDriver.mute) {
        return recDriver.mute();
      }
    }
    function unmute() {
      if (mode === 'live' && wsDriver && wsDriver.unmute) {
        return wsDriver.unmute();
      } else if (mode === 'dvr' && recDriver && recDriver.unmute) {
        return recDriver.unmute();
      }
    }
    return {
      init,
      play,
      pause,
      seek,
      step,
      restart,
      stop,
      mute,
      unmute,
      getCurrentTime,
      // DVR-specific methods
      goLive,
      getMode,
      getMetadata,
      getEstimatedDuration,
      refreshRecording
    };
  }

  async function parse$1(responses, _ref) {
    let {
      encoding
    } = _ref;
    const textDecoder = new TextDecoder(encoding);
    let cols;
    let rows;
    let timing = (await responses[0].text()).split("\n").filter(line => line.length > 0).map(line => line.split(" "));
    if (timing[0].length < 3) {
      timing = timing.map(entry => ["O", entry[0], entry[1]]);
    }
    const buffer = await responses[1].arrayBuffer();
    const array = new Uint8Array(buffer);
    const dataOffset = array.findIndex(byte => byte == 0x0a) + 1;
    const header = textDecoder.decode(array.subarray(0, dataOffset));
    const sizeMatch = header.match(/COLUMNS="(\d+)" LINES="(\d+)"/);
    if (sizeMatch !== null) {
      cols = parseInt(sizeMatch[1], 10);
      rows = parseInt(sizeMatch[2], 10);
    }
    const stdout = {
      array,
      cursor: dataOffset
    };
    let stdin = stdout;
    if (responses[2] !== undefined) {
      const buffer = await responses[2].arrayBuffer();
      const array = new Uint8Array(buffer);
      stdin = {
        array,
        cursor: dataOffset
      };
    }
    const events = [];
    let time = 0;
    for (const entry of timing) {
      time += parseFloat(entry[1]);
      if (entry[0] === "O") {
        const count = parseInt(entry[2], 10);
        const bytes = stdout.array.subarray(stdout.cursor, stdout.cursor + count);
        const text = textDecoder.decode(bytes);
        events.push([time, "o", text]);
        stdout.cursor += count;
      } else if (entry[0] === "I") {
        const count = parseInt(entry[2], 10);
        const bytes = stdin.array.subarray(stdin.cursor, stdin.cursor + count);
        const text = textDecoder.decode(bytes);
        events.push([time, "i", text]);
        stdin.cursor += count;
      } else if (entry[0] === "S" && entry[2] === "SIGWINCH") {
        const cols = parseInt(entry[4].slice(5), 10);
        const rows = parseInt(entry[3].slice(5), 10);
        events.push([time, "r", `${cols}x${rows}`]);
      } else if (entry[0] === "H" && entry[2] === "COLUMNS") {
        cols = parseInt(entry[3], 10);
      } else if (entry[0] === "H" && entry[2] === "LINES") {
        rows = parseInt(entry[3], 10);
      }
    }
    cols = cols ?? 80;
    rows = rows ?? 24;
    return {
      cols,
      rows,
      events
    };
  }

  async function parse(response, _ref) {
    let {
      encoding
    } = _ref;
    const textDecoder = new TextDecoder(encoding);
    const buffer = await response.arrayBuffer();
    const array = new Uint8Array(buffer);
    const firstFrame = parseFrame(array);
    const baseTime = firstFrame.time;
    const firstFrameText = textDecoder.decode(firstFrame.data);
    const sizeMatch = firstFrameText.match(/\x1b\[8;(\d+);(\d+)t/);
    const events = [];
    let cols = 80;
    let rows = 24;
    if (sizeMatch !== null) {
      cols = parseInt(sizeMatch[2], 10);
      rows = parseInt(sizeMatch[1], 10);
    }
    let cursor = 0;
    let frame = parseFrame(array);
    while (frame !== undefined) {
      const time = frame.time - baseTime;
      const text = textDecoder.decode(frame.data);
      events.push([time, "o", text]);
      cursor += frame.len;
      frame = parseFrame(array.subarray(cursor));
    }
    return {
      cols,
      rows,
      events
    };
  }
  function parseFrame(array) {
    if (array.length < 13) return;
    const time = parseTimestamp(array.subarray(0, 8));
    const len = parseNumber(array.subarray(8, 12));
    const data = array.subarray(12, 12 + len);
    return {
      time,
      data,
      len: len + 12
    };
  }
  function parseNumber(array) {
    return array[0] + array[1] * 256 + array[2] * 256 * 256 + array[3] * 256 * 256 * 256;
  }
  function parseTimestamp(array) {
    const sec = parseNumber(array.subarray(0, 4));
    const usec = parseNumber(array.subarray(4, 8));
    return sec + usec / 1000000;
  }

  const DEFAULT_COLS = 80;
  const DEFAULT_ROWS = 24;
  const vt = init({
    module: vtWasmModule
  }); // trigger async loading of wasm

  class State {
    constructor(core) {
      this.core = core;
      this.driver = core.driver;
    }
    onEnter(data) {}
    init() {}
    play() {}
    pause() {}
    togglePlay() {}
    mute() {
      if (this.driver && this.driver.mute()) {
        this.core._dispatchEvent("muted", true);
      }
    }
    unmute() {
      if (this.driver && this.driver.unmute()) {
        this.core._dispatchEvent("muted", false);
      }
    }
    seek(where) {
      return false;
    }
    step(n) {}
    stop() {
      this.driver.stop();
    }
  }
  class UninitializedState extends State {
    async init() {
      try {
        await this.core._initializeDriver();
        return this.core._setState("idle");
      } catch (e) {
        this.core._setState("errored");
        throw e;
      }
    }
    async play() {
      this.core._dispatchEvent("play");
      const idleState = await this.init();
      await idleState.doPlay();
    }
    async togglePlay() {
      await this.play();
    }
    async seek(where) {
      const idleState = await this.init();
      return await idleState.seek(where);
    }
    async step(n) {
      const idleState = await this.init();
      await idleState.step(n);
    }
    stop() {}
  }
  class Idle extends State {
    onEnter(_ref) {
      let {
        reason,
        message
      } = _ref;
      this.core._dispatchEvent("idle", {
        message
      });
      if (reason === "paused") {
        this.core._dispatchEvent("pause");
      }
    }
    async play() {
      this.core._dispatchEvent("play");
      await this.doPlay();
    }
    async doPlay() {
      const stop = await this.driver.play();
      if (stop === true) {
        this.core._setState("playing");
      } else if (typeof stop === "function") {
        this.core._setState("playing");
        this.driver.stop = stop;
      }
    }
    async togglePlay() {
      await this.play();
    }
    seek(where) {
      return this.driver.seek(where);
    }
    step(n) {
      this.driver.step(n);
    }
  }
  class PlayingState extends State {
    onEnter() {
      this.core._dispatchEvent("playing");
    }
    pause() {
      if (this.driver.pause() === true) {
        this.core._setState("idle", {
          reason: "paused"
        });
      }
    }
    togglePlay() {
      this.pause();
    }
    seek(where) {
      return this.driver.seek(where);
    }
  }
  class LoadingState extends State {
    onEnter() {
      this.core._dispatchEvent("loading");
    }
  }
  class OfflineState extends State {
    onEnter(_ref2) {
      let {
        message
      } = _ref2;
      this.core._dispatchEvent("offline", {
        message
      });
    }
  }
  class EndedState extends State {
    onEnter(_ref3) {
      let {
        message
      } = _ref3;
      this.core._dispatchEvent("ended", {
        message
      });
    }
    async play() {
      this.core._dispatchEvent("play");
      if (await this.driver.restart()) {
        this.core._setState('playing');
      }
    }
    async togglePlay() {
      await this.play();
    }
    async seek(where) {
      if ((await this.driver.seek(where)) === true) {
        this.core._setState('idle');
        return true;
      }
      return false;
    }
  }
  class ErroredState extends State {
    onEnter() {
      this.core._dispatchEvent("errored");
    }
  }
  class Core {
    constructor(src, opts) {
      this.logger = opts.logger;
      this.state = new UninitializedState(this);
      this.stateName = "uninitialized";
      this.driver = getDriver(src);
      this.changedLines = new Set();
      this.duration = undefined;
      this.cols = opts.cols;
      this.rows = opts.rows;
      this.speed = opts.speed;
      this.loop = opts.loop;
      this.autoPlay = opts.autoPlay;
      this.idleTimeLimit = opts.idleTimeLimit;
      this.preload = opts.preload;
      this.startAt = parseNpt(opts.startAt);
      this.poster = this._parsePoster(opts.poster);
      this.markers = this._normalizeMarkers(opts.markers);
      this.pauseOnMarkers = opts.pauseOnMarkers;
      this.audioUrl = opts.audioUrl;
      this.boldIsBright = opts.boldIsBright ?? false;
      this.commandQueue = Promise.resolve();
      this.needsClear = false;
      this.eventHandlers = new Map([["dvrModeChange", []], ["ended", []], ["errored", []], ["idle", []], ["input", []], ["loading", []], ["marker", []], ["metadata", []], ["muted", []], ["offline", []], ["pause", []], ["play", []], ["playing", []], ["ready", []], ["seeked", []], ["vtUpdate", []]]);
    }
    async init() {
      this.wasm = await vt;
      const {
        memory
      } = await this.wasm.default();
      this.memory = memory;
      this._initializeVt(this.cols ?? DEFAULT_COLS, this.rows ?? DEFAULT_ROWS);
      const feed = this._feed.bind(this);
      const onInput = data => {
        this._dispatchEvent("input", {
          data
        });
      };
      const onMarker = _ref4 => {
        let {
          index,
          time,
          label
        } = _ref4;
        this._dispatchEvent("marker", {
          index,
          time,
          label
        });
      };
      const reset = this._resetVt.bind(this);
      const resize = this._resizeVt.bind(this);
      const setState = this._setState.bind(this);
      const setMetadata = this._setMetadata.bind(this);
      const posterTime = this.poster.type === "npt" && !this.autoPlay ? this.poster.value : undefined;
      this.driver = this.driver({
        feed,
        onInput,
        onMarker,
        reset,
        resize,
        setState,
        setMetadata,
        logger: this.logger
      }, {
        cols: this.cols,
        rows: this.rows,
        speed: this.speed,
        idleTimeLimit: this.idleTimeLimit,
        startAt: this.startAt,
        loop: this.loop,
        posterTime: posterTime,
        markers: this.markers,
        pauseOnMarkers: this.pauseOnMarkers,
        audioUrl: this.audioUrl
      });
      if (typeof this.driver === "function") {
        this.driver = {
          play: this.driver
        };
      }
      if (this.preload || posterTime !== undefined) {
        this._withState(state => state.init());
      }
      const config = {
        isPausable: !!this.driver.pause,
        isSeekable: !!this.driver.seek
      };
      if (this.driver.init === undefined) {
        this.driver.init = () => {
          return {};
        };
      }
      if (this.driver.pause === undefined) {
        this.driver.pause = () => {};
      }
      if (this.driver.seek === undefined) {
        this.driver.seek = where => false;
      }
      if (this.driver.step === undefined) {
        this.driver.step = n => {};
      }
      if (this.driver.stop === undefined) {
        this.driver.stop = () => {};
      }
      if (this.driver.restart === undefined) {
        this.driver.restart = () => {};
      }
      if (this.driver.mute === undefined) {
        this.driver.mute = () => {};
      }
      if (this.driver.unmute === undefined) {
        this.driver.unmute = () => {};
      }
      if (this.driver.getCurrentTime === undefined) {
        const play = this.driver.play;
        let clock = new NullClock();
        this.driver.play = () => {
          clock = new Clock(this.speed);
          return play();
        };
        this.driver.getCurrentTime = () => clock.getTime();
      }
      this._dispatchEvent("ready", config);
      if (this.autoPlay) {
        this.play();
      } else if (this.poster.type === "text") {
        this._feed(this.poster.value);
        this.needsClear = true;
      }
    }
    play() {
      this._clearIfNeeded();
      return this._withState(state => state.play());
    }
    pause() {
      return this._withState(state => state.pause());
    }
    togglePlay() {
      this._clearIfNeeded();
      return this._withState(state => state.togglePlay());
    }
    seek(where) {
      this._clearIfNeeded();
      return this._withState(async state => {
        if (await state.seek(where)) {
          this._dispatchEvent("seeked");
        }
      });
    }
    step(n) {
      this._clearIfNeeded();
      return this._withState(state => state.step(n));
    }
    stop() {
      return this._withState(state => state.stop());
    }
    mute() {
      return this._withState(state => state.mute());
    }
    unmute() {
      return this._withState(state => state.unmute());
    }
    getLine(n, cursorOn) {
      return this.vt.getLine(n, cursorOn);
    }
    getDataView(_ref5, size) {
      let [ptr, len] = _ref5;
      return new DataView(this.memory.buffer, ptr, len * size);
    }
    getUint32Array(_ref6) {
      let [ptr, len] = _ref6;
      return new Uint32Array(this.memory.buffer, ptr, len);
    }
    getCursor() {
      const cursor = this.vt.getCursor();
      if (cursor) {
        return {
          col: cursor[0],
          row: cursor[1],
          visible: true
        };
      }
      return {
        col: 0,
        row: 0,
        visible: false
      };
    }
    getCurrentTime() {
      return this.driver.getCurrentTime();
    }
    getRemainingTime() {
      if (typeof this.duration === "number") {
        return this.duration - Math.min(this.getCurrentTime(), this.duration);
      }
    }
    getProgress() {
      if (typeof this.duration === "number") {
        return Math.min(this.getCurrentTime(), this.duration) / this.duration;
      }
    }
    getDuration() {
      return this.duration;
    }

    // DVR-specific methods
    goLive() {
      if (this.driver.goLive) {
        return this._withState(() => this.driver.goLive());
      }
      return Promise.resolve(false);
    }
    getMode() {
      if (this.driver.getMode) {
        return this.driver.getMode();
      }
      return null;
    }
    addEventListener(eventName, handler) {
      this.eventHandlers.get(eventName).push(handler);
    }
    removeEventListener(eventName, handler) {
      const handlers = this.eventHandlers.get(eventName);
      if (!handlers) return;
      const idx = handlers.indexOf(handler);
      if (idx !== -1) handlers.splice(idx, 1);
    }
    _dispatchEvent(eventName) {
      let data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      for (const h of this.eventHandlers.get(eventName)) {
        h(data);
      }
    }
    _withState(f) {
      return this._enqueueCommand(() => f(this.state));
    }
    _enqueueCommand(f) {
      this.commandQueue = this.commandQueue.then(f);
      return this.commandQueue;
    }
    _setState(newState) {
      let data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      if (this.stateName === newState) return this.state;
      this.stateName = newState;
      if (newState === "playing") {
        this.state = new PlayingState(this);
      } else if (newState === "idle") {
        this.state = new Idle(this);
      } else if (newState === "loading") {
        this.state = new LoadingState(this);
      } else if (newState === "ended") {
        this.state = new EndedState(this);
      } else if (newState === "offline") {
        this.state = new OfflineState(this);
      } else if (newState === "errored") {
        this.state = new ErroredState(this);
      } else {
        throw new Error(`invalid state: ${newState}`);
      }
      this.state.onEnter(data);
      return this.state;
    }
    _setMetadata(meta) {
      // Allow drivers to update metadata dynamically (e.g., when DVR mode loads recording)
      if (meta.duration !== undefined) {
        this.duration = meta.duration;
      }
      if (meta.markers !== undefined) {
        this.markers = this._normalizeMarkers(meta.markers) ?? this.markers;
      }
      this._dispatchEvent("metadata", {
        duration: this.duration,
        markers: this.markers,
        size: meta.size,
        theme: meta.theme,
        hasAudio: meta.hasAudio
      });
    }
    _feed(data) {
      const changedRows = this.vt.feed(data);
      this._dispatchEvent("vtUpdate", {
        changedRows
      });
    }
    async _initializeDriver() {
      const meta = await this.driver.init();
      this.cols = this.cols ?? meta.cols ?? DEFAULT_COLS;
      this.rows = this.rows ?? meta.rows ?? DEFAULT_ROWS;
      this.duration = this.duration ?? meta.duration;
      this.markers = this._normalizeMarkers(meta.markers) ?? this.markers ?? [];
      if (this.cols === 0) {
        this.cols = DEFAULT_COLS;
      }
      if (this.rows === 0) {
        this.rows = DEFAULT_ROWS;
      }
      this._initializeVt(this.cols, this.rows);
      if (meta.poster !== undefined) {
        meta.poster.forEach(text => this.vt.feed(text));
        this.needsClear = true;
      } else if (this.poster.type === "text") {
        this.vt.feed(this.poster.value);
        this.needsClear = true;
      }
      this._dispatchEvent("metadata", {
        size: {
          cols: this.cols,
          rows: this.rows
        },
        theme: meta.theme ?? null,
        duration: this.duration,
        markers: this.markers,
        hasAudio: meta.hasAudio
      });
      this._dispatchEvent("vtUpdate", {
        size: {
          cols: this.cols,
          rows: this.rows
        },
        theme: meta.theme ?? null,
        changedRows: Array.from({
          length: this.rows
        }, (_, i) => i)
      });
    }
    _clearIfNeeded() {
      if (this.needsClear) {
        this._feed('\x1bc');
        this.needsClear = false;
      }
    }
    _resetVt(cols, rows) {
      let init = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
      let theme = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;
      this.logger.debug(`core: vt reset (${cols}x${rows})`);
      this.cols = cols;
      this.rows = rows;
      this._initializeVt(cols, rows);
      if (init !== undefined && init !== "") {
        this.vt.feed(init);
      }
      this._dispatchEvent("metadata", {
        size: {
          cols,
          rows
        },
        theme: theme ?? null
      });
      this._dispatchEvent("vtUpdate", {
        size: {
          cols,
          rows
        },
        theme: theme ?? null,
        changedRows: Array.from({
          length: rows
        }, (_, i) => i)
      });
    }
    _resizeVt(cols, rows) {
      if (cols === this.vt.cols && rows === this.vt.rows) return;
      const changedRows = this.vt.resize(cols, rows);
      this.vt.cols = cols;
      this.vt.rows = rows;
      this.logger.debug(`core: vt resize (${cols}x${rows})`);
      this._dispatchEvent("metadata", {
        size: {
          cols,
          rows
        }
      });
      this._dispatchEvent("vtUpdate", {
        size: {
          cols,
          rows
        },
        changedRows
      });
    }
    _initializeVt(cols, rows) {
      this.logger.debug('vt init', {
        cols,
        rows
      });
      this.vt = this.wasm.create(cols, rows, 100, this.boldIsBright);
      this.vt.cols = cols;
      this.vt.rows = rows;
    }
    _parsePoster(poster) {
      if (typeof poster !== "string") return {};
      if (poster.substring(0, 16) == "data:text/plain,") {
        return {
          type: "text",
          value: poster.substring(16)
        };
      } else if (poster.substring(0, 4) == "npt:") {
        return {
          type: "npt",
          value: parseNpt(poster.substring(4))
        };
      }
      return {};
    }
    _normalizeMarkers(markers) {
      if (Array.isArray(markers)) {
        return markers.map(m => typeof m === "number" ? [m, ""] : m);
      }
    }
  }
  const DRIVERS = new Map([["benchmark", benchmark], ["clock", clock], ["dvr", dvr], ["eventsource", eventsource], ["random", random], ["recording", recording], ["websocket", websocket]]);
  const PARSERS = new Map([["asciicast", parse$2], ["typescript", parse$1], ["ttyrec", parse]]);
  function getDriver(src) {
    if (typeof src === "function") return src;
    if (typeof src === "string") {
      if (src.substring(0, 5) == "ws://" || src.substring(0, 6) == "wss://") {
        src = {
          driver: "websocket",
          url: src
        };
      } else if (src.substring(0, 6) == "clock:") {
        src = {
          driver: "clock"
        };
      } else if (src.substring(0, 7) == "random:") {
        src = {
          driver: "random"
        };
      } else if (src.substring(0, 10) == "benchmark:") {
        src = {
          driver: "benchmark",
          url: src.substring(10)
        };
      } else {
        src = {
          driver: "recording",
          url: src
        };
      }
    }
    if (src.driver === undefined) {
      src.driver = "recording";
    }
    if (src.driver == "recording") {
      if (src.parser === undefined) {
        src.parser = "asciicast";
      }
      if (typeof src.parser === "string") {
        if (PARSERS.has(src.parser)) {
          src.parser = PARSERS.get(src.parser);
        } else {
          throw new Error(`unknown parser: ${src.parser}`);
        }
      }
    }
    if (DRIVERS.has(src.driver)) {
      const driver = DRIVERS.get(src.driver);
      return (callbacks, opts) => driver(src, callbacks, opts);
    } else {
      throw new Error(`unsupported driver: ${JSON.stringify(src)}`);
    }
  }

  let logger = new DummyLogger();
  let core;
  onmessage = async function (e) {
    const promise = invoke(e.data.method, e.data.params);
    if (e.data.id !== undefined) {
      const result = await promise;
      postMessage({
        result,
        id: e.data.id
      });
    }
  };
  function invoke(method, params) {
    switch (method) {
      case "getChanges":
        return core.getChanges();
      case "new":
        const opts = params[1];
        if (opts.logger === true) {
          logger = console;
        }
        opts.logger = logger;
        core = new Core(params[0], opts);
        return;
      case "init":
        return core.init();
      case "play":
        return core.play();
      case "pause":
        return core.pause();
      case "togglePlay":
        return core.togglePlay();
      case "stop":
        return core.stop();
      case "seek":
        return core.seek(params);
      case "step":
        return core.step(params);
      case "getCurrentTime":
        return core.getCurrentTime();
      case "getRemainingTime":
        return core.getRemainingTime();
      case "getProgress":
        return core.getProgress();
      case "addEventListener":
        core.addEventListener(params[0], e => {
          postMessage({
            method: "onEvent",
            params: {
              name: params[0],
              event: e
            }
          });
        });
        return;
      default:
        throw new Error(`invalid method ${method}`);
    }
  }

})();
