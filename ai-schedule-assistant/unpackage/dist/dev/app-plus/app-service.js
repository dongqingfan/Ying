if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global2 = uni.requireGlobal();
  ArrayBuffer = global2.ArrayBuffer;
  Int8Array = global2.Int8Array;
  Uint8Array = global2.Uint8Array;
  Uint8ClampedArray = global2.Uint8ClampedArray;
  Int16Array = global2.Int16Array;
  Uint16Array = global2.Uint16Array;
  Int32Array = global2.Int32Array;
  Uint32Array = global2.Uint32Array;
  Float32Array = global2.Float32Array;
  Float64Array = global2.Float64Array;
  BigInt64Array = global2.BigInt64Array;
  BigUint64Array = global2.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  function getDevtoolsGlobalHook() {
    return getTarget().__VUE_DEVTOOLS_GLOBAL_HOOK__;
  }
  function getTarget() {
    return typeof navigator !== "undefined" && typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {};
  }
  const isProxyAvailable = typeof Proxy === "function";
  const HOOK_SETUP = "devtools-plugin:setup";
  const HOOK_PLUGIN_SETTINGS_SET = "plugin:settings:set";
  class ApiProxy {
    constructor(plugin, hook) {
      this.target = null;
      this.targetQueue = [];
      this.onQueue = [];
      this.plugin = plugin;
      this.hook = hook;
      const defaultSettings = {};
      if (plugin.settings) {
        for (const id in plugin.settings) {
          const item = plugin.settings[id];
          defaultSettings[id] = item.defaultValue;
        }
      }
      const localSettingsSaveId = `__vue-devtools-plugin-settings__${plugin.id}`;
      let currentSettings = { ...defaultSettings };
      try {
        const raw = localStorage.getItem(localSettingsSaveId);
        const data = JSON.parse(raw);
        Object.assign(currentSettings, data);
      } catch (e) {
      }
      this.fallbacks = {
        getSettings() {
          return currentSettings;
        },
        setSettings(value) {
          try {
            localStorage.setItem(localSettingsSaveId, JSON.stringify(value));
          } catch (e) {
          }
          currentSettings = value;
        }
      };
      hook.on(HOOK_PLUGIN_SETTINGS_SET, (pluginId, value) => {
        if (pluginId === this.plugin.id) {
          this.fallbacks.setSettings(value);
        }
      });
      this.proxiedOn = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target.on[prop];
          } else {
            return (...args) => {
              this.onQueue.push({
                method: prop,
                args
              });
            };
          }
        }
      });
      this.proxiedTarget = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target[prop];
          } else if (prop === "on") {
            return this.proxiedOn;
          } else if (Object.keys(this.fallbacks).includes(prop)) {
            return (...args) => {
              this.targetQueue.push({
                method: prop,
                args,
                resolve: () => {
                }
              });
              return this.fallbacks[prop](...args);
            };
          } else {
            return (...args) => {
              return new Promise((resolve) => {
                this.targetQueue.push({
                  method: prop,
                  args,
                  resolve
                });
              });
            };
          }
        }
      });
    }
    async setRealTarget(target) {
      this.target = target;
      for (const item of this.onQueue) {
        this.target.on[item.method](...item.args);
      }
      for (const item of this.targetQueue) {
        item.resolve(await this.target[item.method](...item.args));
      }
    }
  }
  function setupDevtoolsPlugin(pluginDescriptor, setupFn) {
    const target = getTarget();
    const hook = getDevtoolsGlobalHook();
    const enableProxy = isProxyAvailable && pluginDescriptor.enableEarlyProxy;
    if (hook && (target.__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__ || !enableProxy)) {
      hook.emit(HOOK_SETUP, pluginDescriptor, setupFn);
    } else {
      const proxy = enableProxy ? new ApiProxy(pluginDescriptor, hook) : null;
      const list = target.__VUE_DEVTOOLS_PLUGINS__ = target.__VUE_DEVTOOLS_PLUGINS__ || [];
      list.push({
        pluginDescriptor,
        setupFn,
        proxy
      });
      if (proxy)
        setupFn(proxy.proxiedTarget);
    }
  }
  /*!
   * vuex v4.1.0
   * (c) 2022 Evan You
   * @license MIT
   */
  var storeKey = "store";
  function forEachValue(obj, fn) {
    Object.keys(obj).forEach(function(key) {
      return fn(obj[key], key);
    });
  }
  function isObject(obj) {
    return obj !== null && typeof obj === "object";
  }
  function isPromise(val) {
    return val && typeof val.then === "function";
  }
  function assert(condition, msg) {
    if (!condition) {
      throw new Error("[vuex] " + msg);
    }
  }
  function partial(fn, arg) {
    return function() {
      return fn(arg);
    };
  }
  function genericSubscribe(fn, subs, options) {
    if (subs.indexOf(fn) < 0) {
      options && options.prepend ? subs.unshift(fn) : subs.push(fn);
    }
    return function() {
      var i = subs.indexOf(fn);
      if (i > -1) {
        subs.splice(i, 1);
      }
    };
  }
  function resetStore(store2, hot) {
    store2._actions = /* @__PURE__ */ Object.create(null);
    store2._mutations = /* @__PURE__ */ Object.create(null);
    store2._wrappedGetters = /* @__PURE__ */ Object.create(null);
    store2._modulesNamespaceMap = /* @__PURE__ */ Object.create(null);
    var state = store2.state;
    installModule(store2, state, [], store2._modules.root, true);
    resetStoreState(store2, state, hot);
  }
  function resetStoreState(store2, state, hot) {
    var oldState = store2._state;
    var oldScope = store2._scope;
    store2.getters = {};
    store2._makeLocalGettersCache = /* @__PURE__ */ Object.create(null);
    var wrappedGetters = store2._wrappedGetters;
    var computedObj = {};
    var computedCache = {};
    var scope = vue.effectScope(true);
    scope.run(function() {
      forEachValue(wrappedGetters, function(fn, key) {
        computedObj[key] = partial(fn, store2);
        computedCache[key] = vue.computed(function() {
          return computedObj[key]();
        });
        Object.defineProperty(store2.getters, key, {
          get: function() {
            return computedCache[key].value;
          },
          enumerable: true
          // for local getters
        });
      });
    });
    store2._state = vue.reactive({
      data: state
    });
    store2._scope = scope;
    if (store2.strict) {
      enableStrictMode(store2);
    }
    if (oldState) {
      if (hot) {
        store2._withCommit(function() {
          oldState.data = null;
        });
      }
    }
    if (oldScope) {
      oldScope.stop();
    }
  }
  function installModule(store2, rootState, path, module, hot) {
    var isRoot = !path.length;
    var namespace = store2._modules.getNamespace(path);
    if (module.namespaced) {
      if (store2._modulesNamespaceMap[namespace] && true) {
        console.error("[vuex] duplicate namespace " + namespace + " for the namespaced module " + path.join("/"));
      }
      store2._modulesNamespaceMap[namespace] = module;
    }
    if (!isRoot && !hot) {
      var parentState = getNestedState(rootState, path.slice(0, -1));
      var moduleName = path[path.length - 1];
      store2._withCommit(function() {
        {
          if (moduleName in parentState) {
            console.warn(
              '[vuex] state field "' + moduleName + '" was overridden by a module with the same name at "' + path.join(".") + '"'
            );
          }
        }
        parentState[moduleName] = module.state;
      });
    }
    var local = module.context = makeLocalContext(store2, namespace, path);
    module.forEachMutation(function(mutation, key) {
      var namespacedType = namespace + key;
      registerMutation(store2, namespacedType, mutation, local);
    });
    module.forEachAction(function(action, key) {
      var type = action.root ? key : namespace + key;
      var handler = action.handler || action;
      registerAction(store2, type, handler, local);
    });
    module.forEachGetter(function(getter, key) {
      var namespacedType = namespace + key;
      registerGetter(store2, namespacedType, getter, local);
    });
    module.forEachChild(function(child, key) {
      installModule(store2, rootState, path.concat(key), child, hot);
    });
  }
  function makeLocalContext(store2, namespace, path) {
    var noNamespace = namespace === "";
    var local = {
      dispatch: noNamespace ? store2.dispatch : function(_type, _payload, _options) {
        var args = unifyObjectStyle(_type, _payload, _options);
        var payload = args.payload;
        var options = args.options;
        var type = args.type;
        if (!options || !options.root) {
          type = namespace + type;
          if (!store2._actions[type]) {
            console.error("[vuex] unknown local action type: " + args.type + ", global type: " + type);
            return;
          }
        }
        return store2.dispatch(type, payload);
      },
      commit: noNamespace ? store2.commit : function(_type, _payload, _options) {
        var args = unifyObjectStyle(_type, _payload, _options);
        var payload = args.payload;
        var options = args.options;
        var type = args.type;
        if (!options || !options.root) {
          type = namespace + type;
          if (!store2._mutations[type]) {
            console.error("[vuex] unknown local mutation type: " + args.type + ", global type: " + type);
            return;
          }
        }
        store2.commit(type, payload, options);
      }
    };
    Object.defineProperties(local, {
      getters: {
        get: noNamespace ? function() {
          return store2.getters;
        } : function() {
          return makeLocalGetters(store2, namespace);
        }
      },
      state: {
        get: function() {
          return getNestedState(store2.state, path);
        }
      }
    });
    return local;
  }
  function makeLocalGetters(store2, namespace) {
    if (!store2._makeLocalGettersCache[namespace]) {
      var gettersProxy = {};
      var splitPos = namespace.length;
      Object.keys(store2.getters).forEach(function(type) {
        if (type.slice(0, splitPos) !== namespace) {
          return;
        }
        var localType = type.slice(splitPos);
        Object.defineProperty(gettersProxy, localType, {
          get: function() {
            return store2.getters[type];
          },
          enumerable: true
        });
      });
      store2._makeLocalGettersCache[namespace] = gettersProxy;
    }
    return store2._makeLocalGettersCache[namespace];
  }
  function registerMutation(store2, type, handler, local) {
    var entry = store2._mutations[type] || (store2._mutations[type] = []);
    entry.push(function wrappedMutationHandler(payload) {
      handler.call(store2, local.state, payload);
    });
  }
  function registerAction(store2, type, handler, local) {
    var entry = store2._actions[type] || (store2._actions[type] = []);
    entry.push(function wrappedActionHandler(payload) {
      var res = handler.call(store2, {
        dispatch: local.dispatch,
        commit: local.commit,
        getters: local.getters,
        state: local.state,
        rootGetters: store2.getters,
        rootState: store2.state
      }, payload);
      if (!isPromise(res)) {
        res = Promise.resolve(res);
      }
      if (store2._devtoolHook) {
        return res.catch(function(err) {
          store2._devtoolHook.emit("vuex:error", err);
          throw err;
        });
      } else {
        return res;
      }
    });
  }
  function registerGetter(store2, type, rawGetter, local) {
    if (store2._wrappedGetters[type]) {
      {
        console.error("[vuex] duplicate getter key: " + type);
      }
      return;
    }
    store2._wrappedGetters[type] = function wrappedGetter(store22) {
      return rawGetter(
        local.state,
        // local state
        local.getters,
        // local getters
        store22.state,
        // root state
        store22.getters
        // root getters
      );
    };
  }
  function enableStrictMode(store2) {
    vue.watch(function() {
      return store2._state.data;
    }, function() {
      {
        assert(store2._committing, "do not mutate vuex store state outside mutation handlers.");
      }
    }, { deep: true, flush: "sync" });
  }
  function getNestedState(state, path) {
    return path.reduce(function(state2, key) {
      return state2[key];
    }, state);
  }
  function unifyObjectStyle(type, payload, options) {
    if (isObject(type) && type.type) {
      options = payload;
      payload = type;
      type = type.type;
    }
    {
      assert(typeof type === "string", "expects string as the type, but found " + typeof type + ".");
    }
    return { type, payload, options };
  }
  var LABEL_VUEX_BINDINGS = "vuex bindings";
  var MUTATIONS_LAYER_ID = "vuex:mutations";
  var ACTIONS_LAYER_ID = "vuex:actions";
  var INSPECTOR_ID = "vuex";
  var actionId = 0;
  function addDevtools(app, store2) {
    setupDevtoolsPlugin(
      {
        id: "org.vuejs.vuex",
        app,
        label: "Vuex",
        homepage: "https://next.vuex.vuejs.org/",
        logo: "https://vuejs.org/images/icons/favicon-96x96.png",
        packageName: "vuex",
        componentStateTypes: [LABEL_VUEX_BINDINGS]
      },
      function(api) {
        api.addTimelineLayer({
          id: MUTATIONS_LAYER_ID,
          label: "Vuex Mutations",
          color: COLOR_LIME_500
        });
        api.addTimelineLayer({
          id: ACTIONS_LAYER_ID,
          label: "Vuex Actions",
          color: COLOR_LIME_500
        });
        api.addInspector({
          id: INSPECTOR_ID,
          label: "Vuex",
          icon: "storage",
          treeFilterPlaceholder: "Filter stores..."
        });
        api.on.getInspectorTree(function(payload) {
          if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
            if (payload.filter) {
              var nodes = [];
              flattenStoreForInspectorTree(nodes, store2._modules.root, payload.filter, "");
              payload.rootNodes = nodes;
            } else {
              payload.rootNodes = [
                formatStoreForInspectorTree(store2._modules.root, "")
              ];
            }
          }
        });
        api.on.getInspectorState(function(payload) {
          if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
            var modulePath = payload.nodeId;
            makeLocalGetters(store2, modulePath);
            payload.state = formatStoreForInspectorState(
              getStoreModule(store2._modules, modulePath),
              modulePath === "root" ? store2.getters : store2._makeLocalGettersCache,
              modulePath
            );
          }
        });
        api.on.editInspectorState(function(payload) {
          if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
            var modulePath = payload.nodeId;
            var path = payload.path;
            if (modulePath !== "root") {
              path = modulePath.split("/").filter(Boolean).concat(path);
            }
            store2._withCommit(function() {
              payload.set(store2._state.data, path, payload.state.value);
            });
          }
        });
        store2.subscribe(function(mutation, state) {
          var data = {};
          if (mutation.payload) {
            data.payload = mutation.payload;
          }
          data.state = state;
          api.notifyComponentUpdate();
          api.sendInspectorTree(INSPECTOR_ID);
          api.sendInspectorState(INSPECTOR_ID);
          api.addTimelineEvent({
            layerId: MUTATIONS_LAYER_ID,
            event: {
              time: Date.now(),
              title: mutation.type,
              data
            }
          });
        });
        store2.subscribeAction({
          before: function(action, state) {
            var data = {};
            if (action.payload) {
              data.payload = action.payload;
            }
            action._id = actionId++;
            action._time = Date.now();
            data.state = state;
            api.addTimelineEvent({
              layerId: ACTIONS_LAYER_ID,
              event: {
                time: action._time,
                title: action.type,
                groupId: action._id,
                subtitle: "start",
                data
              }
            });
          },
          after: function(action, state) {
            var data = {};
            var duration = Date.now() - action._time;
            data.duration = {
              _custom: {
                type: "duration",
                display: duration + "ms",
                tooltip: "Action duration",
                value: duration
              }
            };
            if (action.payload) {
              data.payload = action.payload;
            }
            data.state = state;
            api.addTimelineEvent({
              layerId: ACTIONS_LAYER_ID,
              event: {
                time: Date.now(),
                title: action.type,
                groupId: action._id,
                subtitle: "end",
                data
              }
            });
          }
        });
      }
    );
  }
  var COLOR_LIME_500 = 8702998;
  var COLOR_DARK = 6710886;
  var COLOR_WHITE = 16777215;
  var TAG_NAMESPACED = {
    label: "namespaced",
    textColor: COLOR_WHITE,
    backgroundColor: COLOR_DARK
  };
  function extractNameFromPath(path) {
    return path && path !== "root" ? path.split("/").slice(-2, -1)[0] : "Root";
  }
  function formatStoreForInspectorTree(module, path) {
    return {
      id: path || "root",
      // all modules end with a `/`, we want the last segment only
      // cart/ -> cart
      // nested/cart/ -> cart
      label: extractNameFromPath(path),
      tags: module.namespaced ? [TAG_NAMESPACED] : [],
      children: Object.keys(module._children).map(
        function(moduleName) {
          return formatStoreForInspectorTree(
            module._children[moduleName],
            path + moduleName + "/"
          );
        }
      )
    };
  }
  function flattenStoreForInspectorTree(result, module, filter, path) {
    if (path.includes(filter)) {
      result.push({
        id: path || "root",
        label: path.endsWith("/") ? path.slice(0, path.length - 1) : path || "Root",
        tags: module.namespaced ? [TAG_NAMESPACED] : []
      });
    }
    Object.keys(module._children).forEach(function(moduleName) {
      flattenStoreForInspectorTree(result, module._children[moduleName], filter, path + moduleName + "/");
    });
  }
  function formatStoreForInspectorState(module, getters, path) {
    getters = path === "root" ? getters : getters[path];
    var gettersKeys = Object.keys(getters);
    var storeState = {
      state: Object.keys(module.state).map(function(key) {
        return {
          key,
          editable: true,
          value: module.state[key]
        };
      })
    };
    if (gettersKeys.length) {
      var tree = transformPathsToObjectTree(getters);
      storeState.getters = Object.keys(tree).map(function(key) {
        return {
          key: key.endsWith("/") ? extractNameFromPath(key) : key,
          editable: false,
          value: canThrow(function() {
            return tree[key];
          })
        };
      });
    }
    return storeState;
  }
  function transformPathsToObjectTree(getters) {
    var result = {};
    Object.keys(getters).forEach(function(key) {
      var path = key.split("/");
      if (path.length > 1) {
        var target = result;
        var leafKey = path.pop();
        path.forEach(function(p) {
          if (!target[p]) {
            target[p] = {
              _custom: {
                value: {},
                display: p,
                tooltip: "Module",
                abstract: true
              }
            };
          }
          target = target[p]._custom.value;
        });
        target[leafKey] = canThrow(function() {
          return getters[key];
        });
      } else {
        result[key] = canThrow(function() {
          return getters[key];
        });
      }
    });
    return result;
  }
  function getStoreModule(moduleMap, path) {
    var names = path.split("/").filter(function(n) {
      return n;
    });
    return names.reduce(
      function(module, moduleName, i) {
        var child = module[moduleName];
        if (!child) {
          throw new Error('Missing module "' + moduleName + '" for path "' + path + '".');
        }
        return i === names.length - 1 ? child : child._children;
      },
      path === "root" ? moduleMap : moduleMap.root._children
    );
  }
  function canThrow(cb) {
    try {
      return cb();
    } catch (e) {
      return e;
    }
  }
  var Module = function Module2(rawModule, runtime) {
    this.runtime = runtime;
    this._children = /* @__PURE__ */ Object.create(null);
    this._rawModule = rawModule;
    var rawState = rawModule.state;
    this.state = (typeof rawState === "function" ? rawState() : rawState) || {};
  };
  var prototypeAccessors$1 = { namespaced: { configurable: true } };
  prototypeAccessors$1.namespaced.get = function() {
    return !!this._rawModule.namespaced;
  };
  Module.prototype.addChild = function addChild(key, module) {
    this._children[key] = module;
  };
  Module.prototype.removeChild = function removeChild(key) {
    delete this._children[key];
  };
  Module.prototype.getChild = function getChild(key) {
    return this._children[key];
  };
  Module.prototype.hasChild = function hasChild(key) {
    return key in this._children;
  };
  Module.prototype.update = function update(rawModule) {
    this._rawModule.namespaced = rawModule.namespaced;
    if (rawModule.actions) {
      this._rawModule.actions = rawModule.actions;
    }
    if (rawModule.mutations) {
      this._rawModule.mutations = rawModule.mutations;
    }
    if (rawModule.getters) {
      this._rawModule.getters = rawModule.getters;
    }
  };
  Module.prototype.forEachChild = function forEachChild(fn) {
    forEachValue(this._children, fn);
  };
  Module.prototype.forEachGetter = function forEachGetter(fn) {
    if (this._rawModule.getters) {
      forEachValue(this._rawModule.getters, fn);
    }
  };
  Module.prototype.forEachAction = function forEachAction(fn) {
    if (this._rawModule.actions) {
      forEachValue(this._rawModule.actions, fn);
    }
  };
  Module.prototype.forEachMutation = function forEachMutation(fn) {
    if (this._rawModule.mutations) {
      forEachValue(this._rawModule.mutations, fn);
    }
  };
  Object.defineProperties(Module.prototype, prototypeAccessors$1);
  var ModuleCollection = function ModuleCollection2(rawRootModule) {
    this.register([], rawRootModule, false);
  };
  ModuleCollection.prototype.get = function get(path) {
    return path.reduce(function(module, key) {
      return module.getChild(key);
    }, this.root);
  };
  ModuleCollection.prototype.getNamespace = function getNamespace(path) {
    var module = this.root;
    return path.reduce(function(namespace, key) {
      module = module.getChild(key);
      return namespace + (module.namespaced ? key + "/" : "");
    }, "");
  };
  ModuleCollection.prototype.update = function update$1(rawRootModule) {
    update2([], this.root, rawRootModule);
  };
  ModuleCollection.prototype.register = function register(path, rawModule, runtime) {
    var this$1$1 = this;
    if (runtime === void 0)
      runtime = true;
    {
      assertRawModule(path, rawModule);
    }
    var newModule = new Module(rawModule, runtime);
    if (path.length === 0) {
      this.root = newModule;
    } else {
      var parent = this.get(path.slice(0, -1));
      parent.addChild(path[path.length - 1], newModule);
    }
    if (rawModule.modules) {
      forEachValue(rawModule.modules, function(rawChildModule, key) {
        this$1$1.register(path.concat(key), rawChildModule, runtime);
      });
    }
  };
  ModuleCollection.prototype.unregister = function unregister(path) {
    var parent = this.get(path.slice(0, -1));
    var key = path[path.length - 1];
    var child = parent.getChild(key);
    if (!child) {
      {
        console.warn(
          "[vuex] trying to unregister module '" + key + "', which is not registered"
        );
      }
      return;
    }
    if (!child.runtime) {
      return;
    }
    parent.removeChild(key);
  };
  ModuleCollection.prototype.isRegistered = function isRegistered(path) {
    var parent = this.get(path.slice(0, -1));
    var key = path[path.length - 1];
    if (parent) {
      return parent.hasChild(key);
    }
    return false;
  };
  function update2(path, targetModule, newModule) {
    {
      assertRawModule(path, newModule);
    }
    targetModule.update(newModule);
    if (newModule.modules) {
      for (var key in newModule.modules) {
        if (!targetModule.getChild(key)) {
          {
            console.warn(
              "[vuex] trying to add a new module '" + key + "' on hot reloading, manual reload is needed"
            );
          }
          return;
        }
        update2(
          path.concat(key),
          targetModule.getChild(key),
          newModule.modules[key]
        );
      }
    }
  }
  var functionAssert = {
    assert: function(value) {
      return typeof value === "function";
    },
    expected: "function"
  };
  var objectAssert = {
    assert: function(value) {
      return typeof value === "function" || typeof value === "object" && typeof value.handler === "function";
    },
    expected: 'function or object with "handler" function'
  };
  var assertTypes = {
    getters: functionAssert,
    mutations: functionAssert,
    actions: objectAssert
  };
  function assertRawModule(path, rawModule) {
    Object.keys(assertTypes).forEach(function(key) {
      if (!rawModule[key]) {
        return;
      }
      var assertOptions = assertTypes[key];
      forEachValue(rawModule[key], function(value, type) {
        assert(
          assertOptions.assert(value),
          makeAssertionMessage(path, key, type, value, assertOptions.expected)
        );
      });
    });
  }
  function makeAssertionMessage(path, key, type, value, expected) {
    var buf = key + " should be " + expected + ' but "' + key + "." + type + '"';
    if (path.length > 0) {
      buf += ' in module "' + path.join(".") + '"';
    }
    buf += " is " + JSON.stringify(value) + ".";
    return buf;
  }
  function createStore(options) {
    return new Store(options);
  }
  var Store = function Store2(options) {
    var this$1$1 = this;
    if (options === void 0)
      options = {};
    {
      assert(typeof Promise !== "undefined", "vuex requires a Promise polyfill in this browser.");
      assert(this instanceof Store2, "store must be called with the new operator.");
    }
    var plugins = options.plugins;
    if (plugins === void 0)
      plugins = [];
    var strict = options.strict;
    if (strict === void 0)
      strict = false;
    var devtools = options.devtools;
    this._committing = false;
    this._actions = /* @__PURE__ */ Object.create(null);
    this._actionSubscribers = [];
    this._mutations = /* @__PURE__ */ Object.create(null);
    this._wrappedGetters = /* @__PURE__ */ Object.create(null);
    this._modules = new ModuleCollection(options);
    this._modulesNamespaceMap = /* @__PURE__ */ Object.create(null);
    this._subscribers = [];
    this._makeLocalGettersCache = /* @__PURE__ */ Object.create(null);
    this._scope = null;
    this._devtools = devtools;
    var store2 = this;
    var ref = this;
    var dispatch2 = ref.dispatch;
    var commit2 = ref.commit;
    this.dispatch = function boundDispatch(type, payload) {
      return dispatch2.call(store2, type, payload);
    };
    this.commit = function boundCommit(type, payload, options2) {
      return commit2.call(store2, type, payload, options2);
    };
    this.strict = strict;
    var state = this._modules.root.state;
    installModule(this, state, [], this._modules.root);
    resetStoreState(this, state);
    plugins.forEach(function(plugin) {
      return plugin(this$1$1);
    });
  };
  var prototypeAccessors = { state: { configurable: true } };
  Store.prototype.install = function install(app, injectKey) {
    app.provide(injectKey || storeKey, this);
    app.config.globalProperties.$store = this;
    var useDevtools = this._devtools !== void 0 ? this._devtools : true;
    if (useDevtools) {
      addDevtools(app, this);
    }
  };
  prototypeAccessors.state.get = function() {
    return this._state.data;
  };
  prototypeAccessors.state.set = function(v) {
    {
      assert(false, "use store.replaceState() to explicit replace store state.");
    }
  };
  Store.prototype.commit = function commit(_type, _payload, _options) {
    var this$1$1 = this;
    var ref = unifyObjectStyle(_type, _payload, _options);
    var type = ref.type;
    var payload = ref.payload;
    var options = ref.options;
    var mutation = { type, payload };
    var entry = this._mutations[type];
    if (!entry) {
      {
        console.error("[vuex] unknown mutation type: " + type);
      }
      return;
    }
    this._withCommit(function() {
      entry.forEach(function commitIterator(handler) {
        handler(payload);
      });
    });
    this._subscribers.slice().forEach(function(sub) {
      return sub(mutation, this$1$1.state);
    });
    if (options && options.silent) {
      console.warn(
        "[vuex] mutation type: " + type + ". Silent option has been removed. Use the filter functionality in the vue-devtools"
      );
    }
  };
  Store.prototype.dispatch = function dispatch(_type, _payload) {
    var this$1$1 = this;
    var ref = unifyObjectStyle(_type, _payload);
    var type = ref.type;
    var payload = ref.payload;
    var action = { type, payload };
    var entry = this._actions[type];
    if (!entry) {
      {
        console.error("[vuex] unknown action type: " + type);
      }
      return;
    }
    try {
      this._actionSubscribers.slice().filter(function(sub) {
        return sub.before;
      }).forEach(function(sub) {
        return sub.before(action, this$1$1.state);
      });
    } catch (e) {
      {
        console.warn("[vuex] error in before action subscribers: ");
        console.error(e);
      }
    }
    var result = entry.length > 1 ? Promise.all(entry.map(function(handler) {
      return handler(payload);
    })) : entry[0](payload);
    return new Promise(function(resolve, reject) {
      result.then(function(res) {
        try {
          this$1$1._actionSubscribers.filter(function(sub) {
            return sub.after;
          }).forEach(function(sub) {
            return sub.after(action, this$1$1.state);
          });
        } catch (e) {
          {
            console.warn("[vuex] error in after action subscribers: ");
            console.error(e);
          }
        }
        resolve(res);
      }, function(error) {
        try {
          this$1$1._actionSubscribers.filter(function(sub) {
            return sub.error;
          }).forEach(function(sub) {
            return sub.error(action, this$1$1.state, error);
          });
        } catch (e) {
          {
            console.warn("[vuex] error in error action subscribers: ");
            console.error(e);
          }
        }
        reject(error);
      });
    });
  };
  Store.prototype.subscribe = function subscribe(fn, options) {
    return genericSubscribe(fn, this._subscribers, options);
  };
  Store.prototype.subscribeAction = function subscribeAction(fn, options) {
    var subs = typeof fn === "function" ? { before: fn } : fn;
    return genericSubscribe(subs, this._actionSubscribers, options);
  };
  Store.prototype.watch = function watch$1(getter, cb, options) {
    var this$1$1 = this;
    {
      assert(typeof getter === "function", "store.watch only accepts a function.");
    }
    return vue.watch(function() {
      return getter(this$1$1.state, this$1$1.getters);
    }, cb, Object.assign({}, options));
  };
  Store.prototype.replaceState = function replaceState(state) {
    var this$1$1 = this;
    this._withCommit(function() {
      this$1$1._state.data = state;
    });
  };
  Store.prototype.registerModule = function registerModule(path, rawModule, options) {
    if (options === void 0)
      options = {};
    if (typeof path === "string") {
      path = [path];
    }
    {
      assert(Array.isArray(path), "module path must be a string or an Array.");
      assert(path.length > 0, "cannot register the root module by using registerModule.");
    }
    this._modules.register(path, rawModule);
    installModule(this, this.state, path, this._modules.get(path), options.preserveState);
    resetStoreState(this, this.state);
  };
  Store.prototype.unregisterModule = function unregisterModule(path) {
    var this$1$1 = this;
    if (typeof path === "string") {
      path = [path];
    }
    {
      assert(Array.isArray(path), "module path must be a string or an Array.");
    }
    this._modules.unregister(path);
    this._withCommit(function() {
      var parentState = getNestedState(this$1$1.state, path.slice(0, -1));
      delete parentState[path[path.length - 1]];
    });
    resetStore(this);
  };
  Store.prototype.hasModule = function hasModule(path) {
    if (typeof path === "string") {
      path = [path];
    }
    {
      assert(Array.isArray(path), "module path must be a string or an Array.");
    }
    return this._modules.isRegistered(path);
  };
  Store.prototype.hotUpdate = function hotUpdate(newOptions) {
    this._modules.update(newOptions);
    resetStore(this, true);
  };
  Store.prototype._withCommit = function _withCommit(fn) {
    var committing = this._committing;
    this._committing = true;
    fn();
    this._committing = committing;
  };
  Object.defineProperties(Store.prototype, prototypeAccessors);
  var mapMutations = normalizeNamespace(function(namespace, mutations) {
    var res = {};
    if (!isValidMap(mutations)) {
      console.error("[vuex] mapMutations: mapper parameter must be either an Array or an Object");
    }
    normalizeMap(mutations).forEach(function(ref) {
      var key = ref.key;
      var val = ref.val;
      res[key] = function mappedMutation() {
        var args = [], len = arguments.length;
        while (len--)
          args[len] = arguments[len];
        var commit2 = this.$store.commit;
        if (namespace) {
          var module = getModuleByNamespace(this.$store, "mapMutations", namespace);
          if (!module) {
            return;
          }
          commit2 = module.context.commit;
        }
        return typeof val === "function" ? val.apply(this, [commit2].concat(args)) : commit2.apply(this.$store, [val].concat(args));
      };
    });
    return res;
  });
  var mapGetters = normalizeNamespace(function(namespace, getters) {
    var res = {};
    if (!isValidMap(getters)) {
      console.error("[vuex] mapGetters: mapper parameter must be either an Array or an Object");
    }
    normalizeMap(getters).forEach(function(ref) {
      var key = ref.key;
      var val = ref.val;
      val = namespace + val;
      res[key] = function mappedGetter() {
        if (namespace && !getModuleByNamespace(this.$store, "mapGetters", namespace)) {
          return;
        }
        if (!(val in this.$store.getters)) {
          console.error("[vuex] unknown getter: " + val);
          return;
        }
        return this.$store.getters[val];
      };
      res[key].vuex = true;
    });
    return res;
  });
  var mapActions = normalizeNamespace(function(namespace, actions) {
    var res = {};
    if (!isValidMap(actions)) {
      console.error("[vuex] mapActions: mapper parameter must be either an Array or an Object");
    }
    normalizeMap(actions).forEach(function(ref) {
      var key = ref.key;
      var val = ref.val;
      res[key] = function mappedAction() {
        var args = [], len = arguments.length;
        while (len--)
          args[len] = arguments[len];
        var dispatch2 = this.$store.dispatch;
        if (namespace) {
          var module = getModuleByNamespace(this.$store, "mapActions", namespace);
          if (!module) {
            return;
          }
          dispatch2 = module.context.dispatch;
        }
        return typeof val === "function" ? val.apply(this, [dispatch2].concat(args)) : dispatch2.apply(this.$store, [val].concat(args));
      };
    });
    return res;
  });
  function normalizeMap(map) {
    if (!isValidMap(map)) {
      return [];
    }
    return Array.isArray(map) ? map.map(function(key) {
      return { key, val: key };
    }) : Object.keys(map).map(function(key) {
      return { key, val: map[key] };
    });
  }
  function isValidMap(map) {
    return Array.isArray(map) || isObject(map);
  }
  function normalizeNamespace(fn) {
    return function(namespace, map) {
      if (typeof namespace !== "string") {
        map = namespace;
        namespace = "";
      } else if (namespace.charAt(namespace.length - 1) !== "/") {
        namespace += "/";
      }
      return fn(namespace, map);
    };
  }
  function getModuleByNamespace(store2, helper, namespace) {
    var module = store2._modulesNamespaceMap[namespace];
    if (!module) {
      console.error("[vuex] module namespace not found in " + helper + "(): " + namespace);
    }
    return module;
  }
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$5 = {
    data() {
      return {
        title: "AI日程管理小助理",
        activeTab: "today",
        currentCity: "加载中..."
      };
    },
    computed: {
      ...mapGetters(["todaySchedules", "weekSchedules"])
    },
    onLoad() {
      this.loadSchedules();
      this.getCurrentCity();
    },
    onShow() {
      this.loadSchedules();
      this.getCurrentCity();
    },
    methods: {
      ...mapActions(["loadSchedules"]),
      // 切换标签
      switchTab(tab) {
        this.activeTab = tab;
      },
      // 跳转到添加日程页面
      goToAddSchedule() {
        uni.navigateTo({
          url: "/pages/add-schedule/add-schedule"
        });
      },
      // 跳转到日程详情页面
      goToDetail(id) {
        uni.navigateTo({
          url: `/pages/schedule-detail/schedule-detail?id=${id}`
        });
      },
      // 格式化时间 (24小时制，如 14:30)
      formatTime(time) {
        return time;
      },
      // 格式化日期 (如 10/16)
      formatDate(dateString) {
        const date = new Date(dateString);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      },
      // 格式化星期几
      formatWeekDay(dateString) {
        const date = new Date(dateString);
        const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
        return weekDays[date.getDay()];
      },
      // 获取当前城市
      getCurrentCity() {
        const userCity = uni.getStorageSync("userCity");
        const settings = uni.getStorageSync("settings");
        let enableLocation = false;
        if (settings) {
          try {
            const settingsObj = JSON.parse(settings);
            enableLocation = settingsObj.enableLocation;
          } catch (e) {
            formatAppLog("error", "at pages/index/index.vue:156", "解析设置信息失败", e);
          }
        }
        if (enableLocation && userCity) {
          this.currentCity = userCity;
        } else {
          this.currentCity = "北京市";
          if (enableLocation && !userCity) {
            this.requestLocationInfo();
          }
        }
      },
      // 请求定位信息
      requestLocationInfo() {
        uni.getLocation({
          type: "gcj02",
          success: (res) => {
            uni.setStorageSync("userLocation", {
              latitude: res.latitude,
              longitude: res.longitude,
              timestamp: Date.now()
            });
            this.getLocationCity(res.latitude, res.longitude);
          },
          fail: () => {
            this.currentCity = "北京市";
          }
        });
      },
      // 根据经纬度获取城市名称
      getLocationCity(latitude, longitude) {
        let cityName = "北京市";
        if (latitude > 39 && latitude < 41 && longitude > 116 && longitude < 117) {
          cityName = "北京市";
        } else if (latitude > 30 && latitude < 32 && longitude > 121 && longitude < 122) {
          cityName = "上海市";
        } else if (latitude > 22 && latitude < 24 && longitude > 113 && longitude < 114) {
          cityName = "广州市";
        } else if (latitude > 22 && latitude < 23 && longitude > 113 && longitude < 115) {
          cityName = "深圳市";
        } else if (latitude > 29 && latitude < 31 && longitude > 119 && longitude < 121) {
          cityName = "杭州市";
        } else {
          const cities = ["北京市", "上海市", "广州市", "深圳市", "杭州市", "南京市", "武汉市", "成都市"];
          cityName = cities[Math.floor(Math.random() * cities.length)];
        }
        this.currentCity = cityName;
        uni.setStorageSync("userCity", cityName);
      }
    }
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "status-bar" }, [
        vue.createElementVNode("view", { style: { "visibility": "hidden" } }, "时间占位"),
        vue.createElementVNode("view", null, [
          vue.createElementVNode("text", { class: "icon iconfont icon-wifi" }),
          vue.createElementVNode("text", { class: "icon iconfont icon-signal" }),
          vue.createElementVNode("text", { class: "icon iconfont icon-battery-full" })
        ])
      ]),
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode(
          "text",
          { style: { "font-size": "40rpx", "font-weight": "bold" } },
          vue.toDisplayString($data.currentCity),
          1
          /* TEXT */
        ),
        vue.createElementVNode("text", {
          class: "icon iconfont icon-search",
          style: { "font-size": "40rpx" }
        })
      ]),
      vue.createCommentVNode(" 今日/本周切换标签 "),
      vue.createElementVNode("view", { class: "tab-bar" }, [
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["tab", { active: $data.activeTab === "today" }]),
            onClick: _cache[0] || (_cache[0] = ($event) => $options.switchTab("today"))
          },
          "今日",
          2
          /* CLASS */
        ),
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["tab", { active: $data.activeTab === "week" }]),
            onClick: _cache[1] || (_cache[1] = ($event) => $options.switchTab("week"))
          },
          "本周",
          2
          /* CLASS */
        )
      ]),
      vue.createElementVNode("view", { class: "content" }, [
        vue.createCommentVNode(" 今日日程视图 "),
        $data.activeTab === "today" ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "schedule-view"
        }, [
          _ctx.todaySchedules.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "empty-tip"
          }, [
            vue.createElementVNode("text", null, "今日暂无日程安排")
          ])) : (vue.openBlock(), vue.createElementBlock("view", { key: 1 }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList(_ctx.todaySchedules, (schedule, index) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: index,
                  class: "schedule-item",
                  onClick: ($event) => $options.goToDetail(schedule.id)
                }, [
                  vue.createElementVNode(
                    "view",
                    { class: "schedule-time" },
                    vue.toDisplayString($options.formatTime(schedule.startTime)),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("view", { class: "schedule-content" }, [
                    vue.createElementVNode(
                      "view",
                      { class: "schedule-title" },
                      vue.toDisplayString(schedule.title),
                      1
                      /* TEXT */
                    ),
                    schedule.location ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 0,
                      class: "schedule-location"
                    }, [
                      vue.createElementVNode("text", { class: "icon iconfont icon-location" }),
                      vue.createTextVNode(
                        " " + vue.toDisplayString(schedule.location),
                        1
                        /* TEXT */
                      )
                    ])) : vue.createCommentVNode("v-if", true),
                    schedule.weatherAlert ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 1,
                      class: "alert"
                    }, [
                      vue.createElementVNode("text", { class: "icon iconfont icon-warning" }),
                      vue.createElementVNode(
                        "text",
                        null,
                        vue.toDisplayString(schedule.weatherAlert),
                        1
                        /* TEXT */
                      )
                    ])) : vue.createCommentVNode("v-if", true)
                  ])
                ], 8, ["onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]))
        ])) : vue.createCommentVNode("v-if", true),
        vue.createCommentVNode(" 本周日程视图 "),
        $data.activeTab === "week" ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "schedule-view"
        }, [
          _ctx.weekSchedules.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "empty-tip"
          }, [
            vue.createElementVNode("text", null, "本周暂无日程安排")
          ])) : (vue.openBlock(), vue.createElementBlock("view", { key: 1 }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList(_ctx.weekSchedules, (schedule, index) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: index,
                  class: "schedule-item",
                  onClick: ($event) => $options.goToDetail(schedule.id)
                }, [
                  vue.createElementVNode("view", { class: "schedule-time" }, [
                    vue.createTextVNode(
                      vue.toDisplayString($options.formatWeekDay(schedule.date)),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode("br"),
                    vue.createTextVNode(
                      vue.toDisplayString($options.formatDate(schedule.date)),
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.createElementVNode("view", { class: "schedule-content" }, [
                    vue.createElementVNode(
                      "view",
                      { class: "schedule-title" },
                      vue.toDisplayString(schedule.title),
                      1
                      /* TEXT */
                    ),
                    schedule.location ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 0,
                      class: "schedule-location"
                    }, [
                      vue.createElementVNode("text", { class: "icon iconfont icon-location" }),
                      vue.createTextVNode(
                        " " + vue.toDisplayString(schedule.location),
                        1
                        /* TEXT */
                      )
                    ])) : vue.createCommentVNode("v-if", true)
                  ])
                ], 8, ["onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]))
        ])) : vue.createCommentVNode("v-if", true)
      ]),
      vue.createCommentVNode(" 添加日程按钮 "),
      vue.createElementVNode("view", {
        class: "fab-btn",
        onClick: _cache[2] || (_cache[2] = (...args) => $options.goToAddSchedule && $options.goToAddSchedule(...args))
      }, [
        vue.createElementVNode("text", { class: "icon iconfont icon-add" })
      ])
    ]);
  }
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$4], ["__file", "D:/workspace/src/Ying/ai-schedule-assistant/pages/index/index.vue"]]);
  const _sfc_main$4 = {
    data() {
      const now = /* @__PURE__ */ new Date();
      return {
        weekDays: ["日", "一", "二", "三", "四", "五", "六"],
        currentYear: now.getFullYear(),
        currentMonth: now.getMonth(),
        selectedDay: now.getDate(),
        prevMonthDays: [],
        nextMonthDays: [],
        daysInMonth: 0
      };
    },
    computed: {
      ...mapGetters(["schedulesByDate"]),
      // 当前年月格式化为YYYY-MM，用于日期选择器
      currentYearMonth() {
        return `${this.currentYear}-${(this.currentMonth + 1).toString().padStart(2, "0")}`;
      },
      // 选中日期的日程
      selectedDateSchedules() {
        const selectedDate = new Date(this.currentYear, this.currentMonth, this.selectedDay);
        const dateString = this.formatDateToLocalString(selectedDate);
        return this.schedulesByDate(dateString);
      },
      // 格式化选中的日期
      formattedSelectedDate() {
        return `${this.currentMonth + 1}月${this.selectedDay}日`;
      }
    },
    onLoad() {
      this.loadSchedules();
      this.initCalendar();
    },
    onShow() {
      this.loadSchedules();
      this.initCalendar();
    },
    methods: {
      ...mapActions(["loadSchedules"]),
      ...mapMutations(["setCurrentDate"]),
      // 初始化日历
      initCalendar() {
        this.daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const prevMonthDays = new Date(this.currentYear, this.currentMonth, 0).getDate();
        this.prevMonthDays = [];
        for (let i = firstDay - 1; i >= 0; i--) {
          this.prevMonthDays.push(prevMonthDays - i);
        }
        const totalDays = firstDay + this.daysInMonth;
        const nextMonthDaysCount = 7 - (totalDays % 7 || 7);
        this.nextMonthDays = [];
        for (let i = 1; i <= nextMonthDaysCount; i++) {
          this.nextMonthDays.push(i);
        }
        this.setCurrentDate(new Date(this.currentYear, this.currentMonth, this.selectedDay));
      },
      // 切换到上个月
      prevMonth() {
        if (this.currentMonth === 0) {
          this.currentYear--;
          this.currentMonth = 11;
        } else {
          this.currentMonth--;
        }
        const daysInNewMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        if (this.selectedDay > daysInNewMonth) {
          this.selectedDay = daysInNewMonth;
        }
        this.initCalendar();
      },
      // 切换到下个月
      nextMonth() {
        if (this.currentMonth === 11) {
          this.currentYear++;
          this.currentMonth = 0;
        } else {
          this.currentMonth++;
        }
        const daysInNewMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        if (this.selectedDay > daysInNewMonth) {
          this.selectedDay = daysInNewMonth;
        }
        this.initCalendar();
      },
      // 年月选择器变化事件处理
      onYearMonthChange(e) {
        const dateStr = e.detail.value;
        const [year, month] = dateStr.split("-").map(Number);
        this.currentYear = year;
        this.currentMonth = month - 1;
        const daysInNewMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        if (this.selectedDay > daysInNewMonth) {
          this.selectedDay = daysInNewMonth;
        }
        this.initCalendar();
      },
      // 选择日期
      selectDate(day) {
        this.selectedDay = day;
        this.setCurrentDate(new Date(this.currentYear, this.currentMonth, this.selectedDay));
      },
      // 判断是否是今天
      isToday(day) {
        const now = /* @__PURE__ */ new Date();
        return now.getFullYear() === this.currentYear && now.getMonth() === this.currentMonth && now.getDate() === day;
      },
      // 判断是否是选中的日期
      isSelected(day) {
        return this.selectedDay === day;
      },
      // 判断日期是否有日程安排
      hasEvent(day) {
        const date = new Date(this.currentYear, this.currentMonth, day);
        const dateString = this.formatDateToLocalString(date);
        return this.schedulesByDate(dateString).length > 0;
      },
      // 格式化日期为本地日期字符串 (YYYY-MM-DD)，避免时区问题
      formatDateToLocalString(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        return `${year}-${month}-${day}`;
      },
      // 跳转到添加日程页面
      goToAddSchedule() {
        const selectedDate = new Date(this.currentYear, this.currentMonth, this.selectedDay);
        const dateString = this.formatDateToLocalString(selectedDate);
        uni.navigateTo({
          url: `/pages/add-schedule/add-schedule?date=${dateString}`
        });
      },
      // 跳转到日程详情页面
      goToDetail(id) {
        uni.navigateTo({
          url: `/pages/schedule-detail/schedule-detail?id=${id}`
        });
      },
      // 格式化时间
      formatTime(time) {
        return time;
      }
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "status-bar" }, [
        vue.createElementVNode("view", { style: { "visibility": "hidden" } }, "时间占位"),
        vue.createElementVNode("view", null, [
          vue.createElementVNode("text", { class: "icon iconfont icon-wifi" }),
          vue.createElementVNode("text", { class: "icon iconfont icon-signal" }),
          vue.createElementVNode("text", { class: "icon iconfont icon-battery-full" })
        ])
      ]),
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("text", { style: { "font-size": "40rpx", "font-weight": "bold" } }, "日历"),
        vue.createElementVNode("text", {
          class: "icon iconfont icon-search",
          style: { "font-size": "40rpx" }
        })
      ]),
      vue.createElementVNode("view", { class: "content" }, [
        vue.createCommentVNode(" 月历视图 "),
        vue.createElementVNode("view", { class: "calendar-view" }, [
          vue.createElementVNode("view", { class: "calendar-header" }, [
            vue.createElementVNode("text", {
              class: "icon iconfont icon-left",
              onClick: _cache[0] || (_cache[0] = (...args) => $options.prevMonth && $options.prevMonth(...args))
            }),
            vue.createCommentVNode(" 修改年月选择方式，使用内联选择器 "),
            vue.createElementVNode("view", { class: "year-month-inline-selector" }, [
              vue.createElementVNode("picker", {
                mode: "date",
                fields: "month",
                value: $options.currentYearMonth,
                onChange: _cache[1] || (_cache[1] = (...args) => $options.onYearMonthChange && $options.onYearMonthChange(...args)),
                class: "year-month-picker"
              }, [
                vue.createElementVNode(
                  "text",
                  { class: "year-month-selector" },
                  vue.toDisplayString($data.currentYear) + "年" + vue.toDisplayString($data.currentMonth + 1) + "月",
                  1
                  /* TEXT */
                )
              ], 40, ["value"])
            ]),
            vue.createElementVNode("text", {
              class: "icon iconfont icon-right",
              onClick: _cache[2] || (_cache[2] = (...args) => $options.nextMonth && $options.nextMonth(...args))
            })
          ]),
          vue.createElementVNode("view", { class: "calendar-weekdays" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($data.weekDays, (day, index) => {
                return vue.openBlock(), vue.createElementBlock(
                  "view",
                  { key: index },
                  vue.toDisplayString(day),
                  1
                  /* TEXT */
                );
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          vue.createElementVNode("view", { class: "calendar-grid" }, [
            vue.createCommentVNode(" 上个月的日期 "),
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($data.prevMonthDays, (day, index) => {
                return vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: "prev-" + index,
                    class: "calendar-date prev-month"
                  },
                  vue.toDisplayString(day),
                  1
                  /* TEXT */
                );
              }),
              128
              /* KEYED_FRAGMENT */
            )),
            vue.createCommentVNode(" 当月的日期 "),
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($data.daysInMonth, (day) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: day,
                  class: vue.normalizeClass(["calendar-date", {
                    "today": $options.isToday(day),
                    "selected": $options.isSelected(day),
                    "has-event": $options.hasEvent(day)
                  }]),
                  onClick: ($event) => $options.selectDate(day)
                }, vue.toDisplayString(day), 11, ["onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            )),
            vue.createCommentVNode(" 下个月的日期 "),
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($data.nextMonthDays, (day, index) => {
                return vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: "next-" + index,
                    class: "calendar-date next-month"
                  },
                  vue.toDisplayString(day),
                  1
                  /* TEXT */
                );
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          vue.createElementVNode("view", { class: "selected-date-schedules" }, [
            vue.createElementVNode(
              "view",
              { class: "selected-date-title" },
              vue.toDisplayString($options.formattedSelectedDate) + "日程",
              1
              /* TEXT */
            ),
            $options.selectedDateSchedules.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "empty-schedule"
            }, [
              vue.createElementVNode("view", { class: "empty-schedule-content" }, [
                vue.createCommentVNode(' <view class="empty-icon">\r\n								<text class="icon iconfont icon-calendar"></text>\r\n							</view> '),
                vue.createElementVNode("text", { class: "empty-text" }, "当日无日程安排"),
                vue.createElementVNode("text", { class: "empty-tip" }, '点击右下角"+"添加日程')
              ])
            ])) : (vue.openBlock(), vue.createElementBlock("view", { key: 1 }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($options.selectedDateSchedules, (schedule, index) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    key: index,
                    class: "schedule-item",
                    onClick: ($event) => $options.goToDetail(schedule.id)
                  }, [
                    vue.createElementVNode(
                      "view",
                      { class: "schedule-time" },
                      vue.toDisplayString($options.formatTime(schedule.startTime)),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode("view", { class: "schedule-content" }, [
                      vue.createElementVNode(
                        "view",
                        { class: "schedule-title" },
                        vue.toDisplayString(schedule.title),
                        1
                        /* TEXT */
                      ),
                      schedule.location ? (vue.openBlock(), vue.createElementBlock("view", {
                        key: 0,
                        class: "schedule-location"
                      }, [
                        vue.createElementVNode("text", { class: "icon iconfont icon-location" }),
                        vue.createTextVNode(
                          " " + vue.toDisplayString(schedule.location),
                          1
                          /* TEXT */
                        )
                      ])) : vue.createCommentVNode("v-if", true)
                    ])
                  ], 8, ["onClick"]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ]))
          ])
        ])
      ]),
      vue.createCommentVNode(" 添加日程按钮 "),
      vue.createElementVNode("view", {
        class: "fab-btn",
        onClick: _cache[3] || (_cache[3] = (...args) => $options.goToAddSchedule && $options.goToAddSchedule(...args))
      }, [
        vue.createElementVNode("text", { class: "icon iconfont icon-add" })
      ])
    ]);
  }
  const PagesCalendarCalendar = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$3], ["__file", "D:/workspace/src/Ying/ai-schedule-assistant/pages/calendar/calendar.vue"]]);
  const _sfc_main$3 = {
    data() {
      const now = /* @__PURE__ */ new Date();
      now.getFullYear();
      now.getMonth();
      now.getDate();
      const defaultDate = this.formatDateString(now);
      const defaultStartHour = now.getHours().toString().padStart(2, "0");
      const defaultStartMinute = (Math.ceil(now.getMinutes() / 15) * 15 % 60).toString().padStart(2, "0");
      let defaultEndTime = new Date(now);
      defaultEndTime.setHours(now.getHours() + 1);
      defaultEndTime.setMinutes(Math.ceil(now.getMinutes() / 15) * 15 % 60);
      const defaultEndHour = defaultEndTime.getHours().toString().padStart(2, "0");
      const defaultEndMinute = defaultEndTime.getMinutes().toString().padStart(2, "0");
      return {
        scheduleText: "",
        uploadedImageUrl: "",
        showImagePreview: false,
        isEditMode: false,
        // 是否是编辑模式
        scheduleId: "",
        // 编辑中的日程ID
        // 日程信息
        schedule: {
          title: "",
          date: defaultDate,
          startTime: `${defaultStartHour}:${defaultStartMinute}`,
          endTime: `${defaultEndHour}:${defaultEndMinute}`,
          location: "",
          participants: "",
          notes: "",
          weatherAnalysis: true
        }
      };
    },
    onLoad(options) {
      if (options.date) {
        this.schedule.date = options.date;
      }
      if (options.id && options.edit === "true") {
        const scheduleToEdit = this.$store.getters.scheduleById(options.id);
        if (scheduleToEdit) {
          this.isEditMode = true;
          this.scheduleId = options.id;
          this.schedule = { ...scheduleToEdit };
        }
      }
    },
    methods: {
      ...mapActions(["addNewSchedule", "updateExistingSchedule"]),
      // 返回上一页
      goBack() {
        uni.navigateBack();
      },
      // 保存日程
      saveSchedule() {
        if (!this.schedule.title) {
          uni.showToast({
            title: "请输入日程标题",
            icon: "none"
          });
          return;
        }
        if (!this.schedule.date) {
          uni.showToast({
            title: "请选择日期",
            icon: "none"
          });
          return;
        }
        if (this.isEditMode) {
          this.updateExistingSchedule(this.schedule);
          uni.showToast({
            title: "日程更新成功",
            icon: "success",
            duration: 2e3,
            success: () => {
              setTimeout(() => {
                uni.navigateBack();
              }, 2e3);
            }
          });
        } else {
          this.addNewSchedule(this.schedule);
          uni.showToast({
            title: "日程保存成功",
            icon: "success",
            duration: 2e3,
            success: () => {
              setTimeout(() => {
                uni.navigateBack();
              }, 2e3);
            }
          });
        }
      },
      // 自动识别文本
      recognizeText() {
        if (!this.scheduleText) {
          uni.showToast({
            title: "请先输入日程信息文本",
            icon: "none"
          });
          return;
        }
        uni.showLoading({
          title: "识别中..."
        });
        setTimeout(() => {
          const recognizedInfo = {
            title: "产品团队周会",
            date: this.formatDateString(/* @__PURE__ */ new Date()),
            startTime: "09:30",
            endTime: "11:00",
            location: "公司会议室A",
            participants: "产品部全体成员",
            notes: "讨论新功能开发计划和进度"
          };
          this.schedule = {
            ...this.schedule,
            ...recognizedInfo
          };
          uni.hideLoading();
          uni.showToast({
            title: "识别成功",
            icon: "success"
          });
        }, 1500);
      },
      // 选择图片
      chooseImage() {
        uni.chooseImage({
          count: 1,
          success: (res) => {
            const tempFilePath = res.tempFilePaths[0];
            this.uploadedImageUrl = tempFilePath;
            this.showImagePreview = true;
            uni.showLoading({
              title: "识别中..."
            });
            setTimeout(() => {
              const recognizedInfo = {
                title: "与客户会面讨论项目进展",
                date: this.formatDateString(/* @__PURE__ */ new Date()),
                startTime: "14:00",
                endTime: "15:30",
                location: "星巴克咖啡(国贸店)",
                participants: "李总、王经理",
                notes: "准备项目进度报告和演示文稿"
              };
              this.schedule = {
                ...this.schedule,
                ...recognizedInfo
              };
              uni.hideLoading();
              uni.showToast({
                title: "识别成功",
                icon: "success"
              });
            }, 2e3);
          }
        });
      },
      // 切换天气分析开关
      toggleWeatherAnalysis(e) {
        this.schedule.weatherAnalysis = e.detail.value;
      },
      // 日期选择器变化处理
      onDateChange(e) {
        this.schedule.date = e.detail.value;
      },
      // 开始时间选择器变化处理
      onStartTimeChange(e) {
        this.schedule.startTime = e.detail.value;
      },
      // 结束时间选择器变化处理
      onEndTimeChange(e) {
        this.schedule.endTime = e.detail.value;
      },
      // 格式化日期为字符串 (YYYY-MM-DD)
      formatDateString(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        return `${year}-${month}-${day}`;
      },
      // 格式化日期显示 (YYYY年MM月DD日)
      formatDate(dateString) {
        if (!dateString)
          return "请选择日期";
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}年${month}月${day}日`;
      }
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createCommentVNode(" 固定在顶部的状态栏和标题栏 "),
      vue.createElementVNode("view", { class: "fixed-top" }, [
        vue.createElementVNode("view", { class: "status-bar" }, [
          vue.createElementVNode("view", { style: { "visibility": "hidden" } }, "时间占位"),
          vue.createElementVNode("view", null, [
            vue.createElementVNode("text", { class: "icon iconfont icon-wifi" }),
            vue.createElementVNode("text", { class: "icon iconfont icon-signal" }),
            vue.createElementVNode("text", { class: "icon iconfont icon-battery-full" })
          ])
        ]),
        vue.createElementVNode("view", { class: "header" }, [
          vue.createElementVNode("view", {
            class: "back-button",
            onClick: _cache[0] || (_cache[0] = (...args) => $options.goBack && $options.goBack(...args))
          }, [
            vue.createElementVNode("text", { class: "iconfont icon-back" })
          ]),
          vue.createElementVNode(
            "text",
            { style: { "font-size": "40rpx", "font-weight": "bold" } },
            vue.toDisplayString($data.isEditMode ? "编辑日程" : "添加日程"),
            1
            /* TEXT */
          ),
          vue.createElementVNode("text", {
            style: { "color": "var(--primary-color)", "font-weight": "500" },
            onClick: _cache[1] || (_cache[1] = (...args) => $options.saveSchedule && $options.saveSchedule(...args))
          }, "保存")
        ])
      ]),
      vue.createCommentVNode(" 内容区域，添加顶部padding以避免被固定头部遮挡 "),
      vue.createElementVNode("view", { class: "content" }, [
        vue.createElementVNode("view", {
          class: "card",
          style: { "margin-bottom": "20rpx", "padding": "30rpx" }
        }, [
          $data.showImagePreview ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            style: { "margin-bottom": "30rpx" }
          }, [
            vue.createElementVNode("image", {
              src: $data.uploadedImageUrl,
              style: { "max-width": "100%", "max-height": "400rpx", "border-radius": "16rpx" }
            }, null, 8, ["src"]),
            vue.createElementVNode("view", { style: { "margin-top": "20rpx", "color": "var(--success-color)" } }, [
              vue.createElementVNode("text", { class: "iconfont icon-check-circle" }),
              vue.createTextVNode(" 识别成功，已自动填写日程信息 ")
            ])
          ])) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode("view", {
            class: "form-group",
            style: { "margin-bottom": "20rpx" }
          }, [
            vue.createElementVNode("label", { class: "form-label" }, "粘贴日程信息"),
            vue.withDirectives(vue.createElementVNode(
              "textarea",
              {
                "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.scheduleText = $event),
                class: "form-input textarea",
                style: { "height": "200rpx" },
                placeholder: "在此粘贴日程信息文本，如会议邀请、邮件内容等"
              },
              null,
              512
              /* NEED_PATCH */
            ), [
              [vue.vModelText, $data.scheduleText]
            ])
          ]),
          vue.createElementVNode("view", { style: { "display": "flex", "gap": "20rpx" } }, [
            vue.createElementVNode("button", {
              class: "btn",
              onClick: _cache[3] || (_cache[3] = (...args) => $options.recognizeText && $options.recognizeText(...args)),
              style: { "flex": "1" }
            }, [
              vue.createElementVNode("text", { class: "iconfont icon-magic" }),
              vue.createTextVNode(" 自动识别填写 ")
            ]),
            vue.createElementVNode("button", {
              class: "btn",
              onClick: _cache[4] || (_cache[4] = (...args) => $options.chooseImage && $options.chooseImage(...args)),
              style: { "flex": "1", "background-color": "var(--secondary-color)", "color": "var(--primary-color)" }
            }, [
              vue.createElementVNode("text", { class: "iconfont icon-image" }),
              vue.createTextVNode(" 上传图片识别 ")
            ])
          ])
        ]),
        vue.createElementVNode("view", { class: "form-group" }, [
          vue.createElementVNode("label", { class: "form-label" }, "日程标题"),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              type: "text",
              "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => $data.schedule.title = $event),
              class: "form-input input-field",
              placeholder: "输入日程标题"
            },
            null,
            512
            /* NEED_PATCH */
          ), [
            [vue.vModelText, $data.schedule.title]
          ])
        ]),
        vue.createElementVNode("view", { class: "form-group" }, [
          vue.createElementVNode("label", { class: "form-label" }, "日期"),
          vue.createElementVNode("picker", {
            mode: "date",
            value: $data.schedule.date,
            onChange: _cache[6] || (_cache[6] = (...args) => $options.onDateChange && $options.onDateChange(...args)),
            class: "form-input date-picker"
          }, [
            vue.createElementVNode(
              "view",
              { class: "picker-value" },
              vue.toDisplayString($options.formatDate($data.schedule.date)),
              1
              /* TEXT */
            )
          ], 40, ["value"])
        ]),
        vue.createElementVNode("view", { style: { "display": "flex", "gap": "20rpx" } }, [
          vue.createElementVNode("view", {
            class: "form-group",
            style: { "flex": "1" }
          }, [
            vue.createElementVNode("label", { class: "form-label" }, "开始时间"),
            vue.createElementVNode("picker", {
              mode: "time",
              value: $data.schedule.startTime,
              onChange: _cache[7] || (_cache[7] = (...args) => $options.onStartTimeChange && $options.onStartTimeChange(...args)),
              class: "form-input time-picker"
            }, [
              vue.createElementVNode(
                "view",
                { class: "picker-value" },
                vue.toDisplayString($data.schedule.startTime),
                1
                /* TEXT */
              )
            ], 40, ["value"])
          ]),
          vue.createElementVNode("view", {
            class: "form-group",
            style: { "flex": "1" }
          }, [
            vue.createElementVNode("label", { class: "form-label" }, "结束时间"),
            vue.createElementVNode("picker", {
              mode: "time",
              value: $data.schedule.endTime,
              onChange: _cache[8] || (_cache[8] = (...args) => $options.onEndTimeChange && $options.onEndTimeChange(...args)),
              class: "form-input time-picker"
            }, [
              vue.createElementVNode(
                "view",
                { class: "picker-value" },
                vue.toDisplayString($data.schedule.endTime),
                1
                /* TEXT */
              )
            ], 40, ["value"])
          ])
        ]),
        vue.createElementVNode("view", { class: "form-group" }, [
          vue.createElementVNode("label", { class: "form-label" }, "地点"),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              type: "text",
              "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => $data.schedule.location = $event),
              class: "form-input input-field",
              placeholder: "输入地点"
            },
            null,
            512
            /* NEED_PATCH */
          ), [
            [vue.vModelText, $data.schedule.location]
          ])
        ]),
        vue.createElementVNode("view", { class: "form-group" }, [
          vue.createElementVNode("label", { class: "form-label" }, "参与人"),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              type: "text",
              "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => $data.schedule.participants = $event),
              class: "form-input input-field",
              placeholder: "输入参与人"
            },
            null,
            512
            /* NEED_PATCH */
          ), [
            [vue.vModelText, $data.schedule.participants]
          ])
        ]),
        vue.createElementVNode("view", { class: "form-group" }, [
          vue.createElementVNode("label", { class: "form-label" }, "备注"),
          vue.withDirectives(vue.createElementVNode(
            "textarea",
            {
              "onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => $data.schedule.notes = $event),
              class: "form-input textarea",
              style: { "height": "160rpx" },
              placeholder: "输入备注信息"
            },
            null,
            512
            /* NEED_PATCH */
          ), [
            [vue.vModelText, $data.schedule.notes]
          ])
        ]),
        vue.createElementVNode("view", { class: "form-group" }, [
          vue.createElementVNode("label", { class: "form-label" }, "天气分析"),
          vue.createElementVNode("view", { style: { "display": "flex", "align-items": "center" } }, [
            vue.createElementVNode("switch", {
              checked: $data.schedule.weatherAnalysis,
              onChange: _cache[12] || (_cache[12] = (...args) => $options.toggleWeatherAnalysis && $options.toggleWeatherAnalysis(...args)),
              color: "var(--primary-color)"
            }, null, 40, ["checked"]),
            vue.createElementVNode("text", { style: { "margin-left": "20rpx", "font-size": "28rpx" } }, "启用目的地天气分析")
          ])
        ]),
        vue.createElementVNode("button", {
          class: "btn",
          onClick: _cache[13] || (_cache[13] = (...args) => $options.saveSchedule && $options.saveSchedule(...args)),
          style: { "width": "100%", "margin-top": "20rpx", "margin-bottom": "120rpx" }
        }, [
          vue.createElementVNode("text", { class: "iconfont icon-save" }),
          vue.createTextVNode(" 保存日程 ")
        ])
      ])
    ]);
  }
  const PagesAddScheduleAddSchedule = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2], ["__file", "D:/workspace/src/Ying/ai-schedule-assistant/pages/add-schedule/add-schedule.vue"]]);
  const _sfc_main$2 = {
    data() {
      return {
        scheduleId: "",
        weatherInfo: null,
        showDeletePopup: false
      };
    },
    computed: {
      ...mapGetters(["scheduleById"]),
      schedule() {
        return this.scheduleId ? this.scheduleById(this.scheduleId) : null;
      }
    },
    onLoad(options) {
      if (options.id) {
        this.scheduleId = options.id;
        this.loadWeatherInfo();
      } else {
        uni.showToast({
          title: "未找到日程信息",
          icon: "none"
        });
        setTimeout(() => {
          uni.navigateBack();
        }, 1500);
      }
    },
    methods: {
      ...mapActions(["removeSchedule"]),
      // 返回上一页
      goBack() {
        uni.navigateBack();
      },
      // 编辑日程
      editSchedule() {
        if (this.schedule) {
          uni.navigateTo({
            url: `/pages/add-schedule/add-schedule?id=${this.scheduleId}&edit=true`
          });
        }
      },
      // 显示删除确认对话框
      showDeleteConfirm() {
        this.showDeletePopup = true;
      },
      // 关闭删除确认对话框
      closeDeleteDialog() {
        this.showDeletePopup = false;
      },
      // 删除日程
      deleteSchedule() {
        try {
          this.closeDeleteDialog();
          if (this.scheduleId) {
            this.removeSchedule(this.scheduleId);
            uni.showToast({
              title: "日程已删除",
              icon: "success",
              duration: 2e3,
              success: () => {
                setTimeout(() => {
                  uni.navigateBack();
                }, 2e3);
              }
            });
          }
        } catch (error) {
          formatAppLog("error", "at pages/schedule-detail/schedule-detail.vue:182", "删除日程出错:", error);
          uni.showToast({
            title: "删除失败，请重试",
            icon: "none"
          });
        }
      },
      // 格式化日期显示 (YYYY年MM月DD日)
      formatDate(dateString) {
        if (!dateString)
          return "";
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}年${month}月${day}日`;
      },
      // 根据天气状况获取对应图标类名
      getWeatherIconClass() {
        if (!this.weatherInfo)
          return "icon-sunny";
        const weatherType = this.weatherInfo.type;
        switch (weatherType) {
          case "sunny":
            return "icon-sunny";
          case "cloudy":
            return "icon-cloudy";
          case "rainy":
            return "icon-rainy";
          case "snowy":
            return "icon-snowy";
          default:
            return "icon-sunny";
        }
      },
      // 加载天气信息（模拟数据，实际应用中应该调用天气API）
      loadWeatherInfo() {
        setTimeout(() => {
          const weatherTypes = ["sunny", "cloudy", "rainy", "snowy"];
          const weatherDescs = ["晴", "多云", "小雨", "小雪"];
          const randomIndex = Math.floor(Math.random() * weatherTypes.length);
          this.weatherInfo = {
            type: weatherTypes[randomIndex],
            description: weatherDescs[randomIndex],
            temperature: Math.floor(Math.random() * 25) + 5,
            // 5-30度
            humidity: Math.floor(Math.random() * 50) + 30,
            // 30-80%
            wind: `${Math.floor(Math.random() * 5) + 1}级`,
            alert: randomIndex > 1 ? "出行建议携带雨伞/防雪装备" : null
            // 下雨/雪时提醒
          };
        }, 500);
      }
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "status-bar" }, [
        vue.createElementVNode("view", { style: { "visibility": "hidden" } }, "时间占位"),
        vue.createElementVNode("view", null, [
          vue.createElementVNode("text", { class: "icon iconfont icon-wifi" }),
          vue.createElementVNode("text", { class: "icon iconfont icon-signal" }),
          vue.createElementVNode("text", { class: "icon iconfont icon-battery-full" })
        ])
      ]),
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("text", {
          class: "icon iconfont icon-back",
          onClick: _cache[0] || (_cache[0] = (...args) => $options.goBack && $options.goBack(...args))
        }),
        vue.createElementVNode("text", { style: { "font-size": "40rpx", "font-weight": "bold" } }, "日程详情"),
        vue.createElementVNode("text", {
          class: "icon iconfont icon-edit",
          onClick: _cache[1] || (_cache[1] = (...args) => $options.editSchedule && $options.editSchedule(...args))
        })
      ]),
      $options.schedule ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "content"
      }, [
        vue.createCommentVNode(" 日程标题和时间 "),
        vue.createElementVNode("view", { class: "detail-card" }, [
          vue.createElementVNode(
            "text",
            { class: "schedule-detail-title" },
            vue.toDisplayString($options.schedule.title),
            1
            /* TEXT */
          ),
          vue.createElementVNode("view", { class: "time-location" }, [
            vue.createElementVNode("view", { class: "detail-time" }, [
              vue.createElementVNode("text", { class: "icon iconfont icon-time" }),
              vue.createElementVNode(
                "text",
                null,
                vue.toDisplayString($options.formatDate($options.schedule.date)) + " " + vue.toDisplayString($options.schedule.startTime) + " - " + vue.toDisplayString($options.schedule.endTime),
                1
                /* TEXT */
              )
            ]),
            $options.schedule.location ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "detail-location"
            }, [
              vue.createElementVNode("text", { class: "icon iconfont icon-location" }),
              vue.createElementVNode(
                "text",
                null,
                vue.toDisplayString($options.schedule.location),
                1
                /* TEXT */
              )
            ])) : vue.createCommentVNode("v-if", true)
          ])
        ]),
        vue.createCommentVNode(" 参与人信息 "),
        $options.schedule.participants ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "detail-card"
        }, [
          vue.createElementVNode("view", { class: "detail-section-title" }, "参与人"),
          vue.createElementVNode(
            "view",
            { class: "detail-content" },
            vue.toDisplayString($options.schedule.participants),
            1
            /* TEXT */
          )
        ])) : vue.createCommentVNode("v-if", true),
        vue.createCommentVNode(" 备注信息 "),
        $options.schedule.notes ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "detail-card"
        }, [
          vue.createElementVNode("view", { class: "detail-section-title" }, "备注"),
          vue.createElementVNode(
            "view",
            { class: "detail-content" },
            vue.toDisplayString($options.schedule.notes),
            1
            /* TEXT */
          )
        ])) : vue.createCommentVNode("v-if", true),
        vue.createCommentVNode(" 天气信息 "),
        $options.schedule.weatherAnalysis && $data.weatherInfo ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 2,
          class: "detail-card"
        }, [
          vue.createElementVNode("view", { class: "detail-section-title" }, "天气信息"),
          vue.createElementVNode("view", { class: "weather-info" }, [
            vue.createElementVNode("view", { class: "weather-main" }, [
              vue.createElementVNode(
                "text",
                {
                  class: vue.normalizeClass(["weather-icon", $options.getWeatherIconClass()])
                },
                null,
                2
                /* CLASS */
              ),
              vue.createElementVNode("view", { class: "weather-temp" }, [
                vue.createElementVNode(
                  "text",
                  null,
                  vue.toDisplayString($data.weatherInfo.temperature) + "°C",
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "weather-desc" },
                  vue.toDisplayString($data.weatherInfo.description),
                  1
                  /* TEXT */
                )
              ])
            ]),
            vue.createElementVNode("view", { class: "weather-details" }, [
              vue.createElementVNode("view", { class: "weather-item" }, [
                vue.createElementVNode("text", { class: "icon iconfont icon-wind" }),
                vue.createElementVNode(
                  "text",
                  null,
                  vue.toDisplayString($data.weatherInfo.wind),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "weather-item" }, [
                vue.createElementVNode("text", { class: "icon iconfont icon-humidity" }),
                vue.createElementVNode(
                  "text",
                  null,
                  "湿度 " + vue.toDisplayString($data.weatherInfo.humidity) + "%",
                  1
                  /* TEXT */
                )
              ])
            ]),
            $data.weatherInfo.alert ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "alert",
              style: { "margin-top": "20rpx" }
            }, [
              vue.createElementVNode("text", { class: "icon iconfont icon-warning" }),
              vue.createElementVNode(
                "text",
                null,
                vue.toDisplayString($data.weatherInfo.alert),
                1
                /* TEXT */
              )
            ])) : vue.createCommentVNode("v-if", true)
          ])
        ])) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("view", { class: "button-group" }, [
          vue.createElementVNode("button", {
            class: "btn btn-primary",
            onClick: _cache[2] || (_cache[2] = (...args) => $options.editSchedule && $options.editSchedule(...args)),
            style: { "width": "48%" }
          }, [
            vue.createElementVNode("text", { class: "icon iconfont icon-edit" }),
            vue.createTextVNode(" 编辑日程 ")
          ]),
          vue.createElementVNode("button", {
            class: "btn btn-danger",
            onClick: _cache[3] || (_cache[3] = (...args) => $options.showDeleteConfirm && $options.showDeleteConfirm(...args)),
            style: { "width": "48%" }
          }, [
            vue.createElementVNode("text", { class: "icon iconfont icon-delete" }),
            vue.createTextVNode(" 删除日程 ")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 自定义确认删除对话框 "),
      $data.showDeletePopup ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "custom-popup-mask"
      }, [
        vue.createElementVNode("view", { class: "custom-popup-dialog" }, [
          vue.createElementVNode("view", { class: "custom-popup-title" }, "确认删除"),
          vue.createElementVNode("view", { class: "custom-popup-content" }, "确定要删除此日程吗？此操作不可撤销。"),
          vue.createElementVNode("view", { class: "custom-popup-buttons" }, [
            vue.createElementVNode("button", {
              class: "custom-popup-button cancel",
              onClick: _cache[4] || (_cache[4] = (...args) => $options.closeDeleteDialog && $options.closeDeleteDialog(...args))
            }, "取消"),
            vue.createElementVNode("button", {
              class: "custom-popup-button confirm",
              onClick: _cache[5] || (_cache[5] = (...args) => $options.deleteSchedule && $options.deleteSchedule(...args))
            }, "删除")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesScheduleDetailScheduleDetail = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__file", "D:/workspace/src/Ying/ai-schedule-assistant/pages/schedule-detail/schedule-detail.vue"]]);
  const _sfc_main$1 = {
    data() {
      return {
        settings: {
          darkMode: false,
          enableNotification: true,
          reminderTime: 1,
          // 0: 不提醒, 1: 提前15分钟, 2: 提前30分钟, 3: 提前1小时, 4: 提前1天
          enableWeather: true,
          enableLocation: true
        },
        reminderOptions: [
          "不提醒",
          "提前15分钟",
          "提前30分钟",
          "提前1小时",
          "提前1天"
        ]
      };
    },
    onLoad() {
      this.loadSettings();
    },
    methods: {
      ...mapActions(["loadSchedules"]),
      // 加载设置
      loadSettings() {
        const savedSettings = uni.getStorageSync("settings");
        if (savedSettings) {
          this.settings = JSON.parse(savedSettings);
        }
      },
      // 保存设置
      saveSettings() {
        uni.setStorageSync("settings", JSON.stringify(this.settings));
      },
      // 切换深色模式
      toggleDarkMode(e) {
        this.settings.darkMode = e.detail.value;
        this.saveSettings();
        uni.showToast({
          title: this.settings.darkMode ? "已开启深色模式" : "已关闭深色模式",
          icon: "none"
        });
      },
      // 切换通知
      toggleNotification(e) {
        this.settings.enableNotification = e.detail.value;
        this.saveSettings();
      },
      // 切换天气分析
      toggleWeather(e) {
        this.settings.enableWeather = e.detail.value;
        this.saveSettings();
      },
      // 切换定位服务
      toggleLocation(e) {
        this.settings.enableLocation = e.detail.value;
        this.saveSettings();
        if (this.settings.enableLocation) {
          uni.getLocation({
            type: "gcj02",
            success: (res) => {
              uni.setStorageSync("userLocation", {
                latitude: res.latitude,
                longitude: res.longitude,
                timestamp: Date.now()
              });
              uni.showToast({
                title: "已开启定位服务",
                icon: "success"
              });
              this.getLocationCity(res.latitude, res.longitude);
            },
            fail: (err) => {
              this.settings.enableLocation = false;
              this.saveSettings();
              uni.showModal({
                title: "定位失败",
                content: "无法获取您的位置信息，请检查是否授予了定位权限。",
                showCancel: false
              });
            }
          });
        } else {
          uni.removeStorageSync("userLocation");
          uni.removeStorageSync("userCity");
        }
      },
      // 根据经纬度获取城市名称
      getLocationCity(latitude, longitude) {
        let cityName = "北京市";
        if (latitude > 39 && latitude < 41 && longitude > 116 && longitude < 117) {
          cityName = "北京市";
        } else if (latitude > 30 && latitude < 32 && longitude > 121 && longitude < 122) {
          cityName = "上海市";
        } else if (latitude > 22 && latitude < 24 && longitude > 113 && longitude < 114) {
          cityName = "广州市";
        } else if (latitude > 22 && latitude < 23 && longitude > 113 && longitude < 115) {
          cityName = "深圳市";
        } else if (latitude > 29 && latitude < 31 && longitude > 119 && longitude < 121) {
          cityName = "杭州市";
        } else {
          const cities = ["北京市", "上海市", "广州市", "深圳市", "杭州市", "南京市", "武汉市", "成都市"];
          cityName = cities[Math.floor(Math.random() * cities.length)];
        }
        uni.setStorageSync("userCity", cityName);
        uni.showToast({
          title: `定位城市：${cityName}`,
          icon: "none",
          duration: 2e3
        });
      },
      // 提醒时间变化处理
      onReminderChange(e) {
        this.settings.reminderTime = parseInt(e.detail.value);
        this.saveSettings();
      },
      // 导出数据
      exportData() {
        const schedules = uni.getStorageSync("schedules") || [];
        if (schedules.length === 0) {
          uni.showToast({
            title: "暂无日程数据可导出",
            icon: "none"
          });
          return;
        }
        uni.showToast({
          title: "导出功能开发中",
          icon: "none"
        });
      },
      // 导入数据
      importData() {
        uni.showToast({
          title: "导入功能开发中",
          icon: "none"
        });
      },
      // 显示清除数据确认对话框
      showClearDataConfirm() {
        this.$refs.clearDataConfirm.open();
      },
      // 关闭清除数据确认对话框
      closeClearDataDialog() {
        this.$refs.clearDataConfirm.close();
      },
      // 清除所有数据
      clearAllData() {
        uni.setStorageSync("schedules", []);
        uni.showToast({
          title: "已清除所有日程数据",
          icon: "success"
        });
        this.closeClearDataDialog();
      },
      // 显示反馈
      showFeedback() {
        uni.showToast({
          title: "反馈功能开发中",
          icon: "none"
        });
      }
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_popup_dialog = vue.resolveComponent("uni-popup-dialog");
    const _component_uni_popup = vue.resolveComponent("uni-popup");
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "status-bar" }, [
        vue.createElementVNode("view", { style: { "visibility": "hidden" } }, "时间占位"),
        vue.createElementVNode("view", null, [
          vue.createElementVNode("text", { class: "icon iconfont icon-wifi" }),
          vue.createElementVNode("text", { class: "icon iconfont icon-signal" }),
          vue.createElementVNode("text", { class: "icon iconfont icon-battery-full" })
        ])
      ]),
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("text", { style: { "font-size": "40rpx", "font-weight": "bold" } }, "设置")
      ]),
      vue.createElementVNode("view", { class: "content" }, [
        vue.createElementVNode("view", { class: "settings-section" }, [
          vue.createElementVNode("view", { class: "settings-section-title" }, "通用设置"),
          vue.createElementVNode("view", { class: "settings-item" }, [
            vue.createElementVNode("view", { class: "settings-item-left" }, [
              vue.createElementVNode("text", { class: "icon iconfont icon-theme" }),
              vue.createElementVNode("text", null, "深色模式")
            ]),
            vue.createElementVNode("switch", {
              checked: $data.settings.darkMode,
              onChange: _cache[0] || (_cache[0] = (...args) => $options.toggleDarkMode && $options.toggleDarkMode(...args)),
              color: "var(--primary-color)"
            }, null, 40, ["checked"])
          ]),
          vue.createElementVNode("view", { class: "settings-item" }, [
            vue.createElementVNode("view", { class: "settings-item-left" }, [
              vue.createElementVNode("text", { class: "icon iconfont icon-notification" }),
              vue.createElementVNode("text", null, "日程提醒")
            ]),
            vue.createElementVNode("switch", {
              checked: $data.settings.enableNotification,
              onChange: _cache[1] || (_cache[1] = (...args) => $options.toggleNotification && $options.toggleNotification(...args)),
              color: "var(--primary-color)"
            }, null, 40, ["checked"])
          ]),
          $data.settings.enableNotification ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "settings-item"
          }, [
            vue.createElementVNode("view", { class: "settings-item-left" }, [
              vue.createElementVNode("text", { class: "icon iconfont icon-time" }),
              vue.createElementVNode("text", null, "提前提醒时间")
            ]),
            vue.createElementVNode("picker", {
              mode: "selector",
              range: $data.reminderOptions,
              value: $data.settings.reminderTime,
              onChange: _cache[2] || (_cache[2] = (...args) => $options.onReminderChange && $options.onReminderChange(...args))
            }, [
              vue.createElementVNode("view", { class: "settings-item-right" }, [
                vue.createElementVNode(
                  "text",
                  null,
                  vue.toDisplayString($data.reminderOptions[$data.settings.reminderTime]),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", { class: "icon iconfont icon-right" })
              ])
            ], 40, ["range", "value"])
          ])) : vue.createCommentVNode("v-if", true)
        ]),
        vue.createElementVNode("view", { class: "settings-section" }, [
          vue.createElementVNode("view", { class: "settings-section-title" }, "天气设置"),
          vue.createElementVNode("view", { class: "settings-item" }, [
            vue.createElementVNode("view", { class: "settings-item-left" }, [
              vue.createElementVNode("text", { class: "icon iconfont icon-weather" }),
              vue.createElementVNode("text", null, "天气分析")
            ]),
            vue.createElementVNode("switch", {
              checked: $data.settings.enableWeather,
              onChange: _cache[3] || (_cache[3] = (...args) => $options.toggleWeather && $options.toggleWeather(...args)),
              color: "var(--primary-color)"
            }, null, 40, ["checked"])
          ]),
          vue.createElementVNode("view", { class: "settings-item" }, [
            vue.createElementVNode("view", { class: "settings-item-left" }, [
              vue.createElementVNode("text", { class: "icon iconfont icon-location" }),
              vue.createElementVNode("text", null, "定位服务")
            ]),
            vue.createElementVNode("switch", {
              checked: $data.settings.enableLocation,
              onChange: _cache[4] || (_cache[4] = (...args) => $options.toggleLocation && $options.toggleLocation(...args)),
              color: "var(--primary-color)"
            }, null, 40, ["checked"])
          ])
        ]),
        vue.createElementVNode("view", { class: "settings-section" }, [
          vue.createElementVNode("view", { class: "settings-section-title" }, "数据管理"),
          vue.createElementVNode("view", {
            class: "settings-item",
            onClick: _cache[5] || (_cache[5] = (...args) => $options.exportData && $options.exportData(...args))
          }, [
            vue.createElementVNode("view", { class: "settings-item-left" }, [
              vue.createElementVNode("text", { class: "icon iconfont icon-export" }),
              vue.createElementVNode("text", null, "导出日程数据")
            ]),
            vue.createElementVNode("text", { class: "icon iconfont icon-right" })
          ]),
          vue.createElementVNode("view", {
            class: "settings-item",
            onClick: _cache[6] || (_cache[6] = (...args) => $options.importData && $options.importData(...args))
          }, [
            vue.createElementVNode("view", { class: "settings-item-left" }, [
              vue.createElementVNode("text", { class: "icon iconfont icon-import" }),
              vue.createElementVNode("text", null, "导入日程数据")
            ]),
            vue.createElementVNode("text", { class: "icon iconfont icon-right" })
          ]),
          vue.createElementVNode("view", {
            class: "settings-item danger",
            onClick: _cache[7] || (_cache[7] = (...args) => $options.showClearDataConfirm && $options.showClearDataConfirm(...args))
          }, [
            vue.createElementVNode("view", { class: "settings-item-left" }, [
              vue.createElementVNode("text", { class: "icon iconfont icon-delete" }),
              vue.createElementVNode("text", null, "清除所有日程")
            ]),
            vue.createElementVNode("text", { class: "icon iconfont icon-right" })
          ])
        ]),
        vue.createElementVNode("view", { class: "settings-section" }, [
          vue.createElementVNode("view", { class: "settings-section-title" }, "关于"),
          vue.createElementVNode("view", { class: "settings-item" }, [
            vue.createElementVNode("view", { class: "settings-item-left" }, [
              vue.createElementVNode("text", { class: "icon iconfont icon-info" }),
              vue.createElementVNode("text", null, "版本")
            ]),
            vue.createElementVNode("text", null, "1.0.0")
          ]),
          vue.createElementVNode("view", {
            class: "settings-item",
            onClick: _cache[8] || (_cache[8] = (...args) => $options.showFeedback && $options.showFeedback(...args))
          }, [
            vue.createElementVNode("view", { class: "settings-item-left" }, [
              vue.createElementVNode("text", { class: "icon iconfont icon-feedback" }),
              vue.createElementVNode("text", null, "意见反馈")
            ]),
            vue.createElementVNode("text", { class: "icon iconfont icon-right" })
          ])
        ])
      ]),
      vue.createCommentVNode(" 确认清除数据对话框 "),
      vue.createVNode(
        _component_uni_popup,
        {
          ref: "clearDataConfirm",
          type: "dialog"
        },
        {
          default: vue.withCtx(() => [
            vue.createVNode(_component_uni_popup_dialog, {
              title: "确认清除",
              content: "确定要清除所有日程数据吗？此操作不可撤销。",
              onConfirm: $options.clearAllData,
              onClose: $options.closeClearDataDialog,
              confirmText: "清除",
              cancelText: "取消"
            }, null, 8, ["onConfirm", "onClose"])
          ]),
          _: 1
          /* STABLE */
        },
        512
        /* NEED_PATCH */
      )
    ]);
  }
  const PagesSettingsSettings = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__file", "D:/workspace/src/Ying/ai-schedule-assistant/pages/settings/settings.vue"]]);
  __definePage("pages/index/index", PagesIndexIndex);
  __definePage("pages/calendar/calendar", PagesCalendarCalendar);
  __definePage("pages/add-schedule/add-schedule", PagesAddScheduleAddSchedule);
  __definePage("pages/schedule-detail/schedule-detail", PagesScheduleDetailScheduleDetail);
  __definePage("pages/settings/settings", PagesSettingsSettings);
  const _sfc_main = {
    onLaunch: function() {
      formatAppLog("log", "at App.vue:4", "App Launch");
      if (!uni.getStorageSync("schedules")) {
        uni.setStorageSync("schedules", []);
      }
    },
    onShow: function() {
      formatAppLog("log", "at App.vue:11", "App Show");
    },
    onHide: function() {
      formatAppLog("log", "at App.vue:14", "App Hide");
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "D:/workspace/src/Ying/ai-schedule-assistant/App.vue"]]);
  const store = createStore({
    state: {
      schedules: [],
      currentDate: /* @__PURE__ */ new Date()
    },
    getters: {
      // 获取所有日程
      allSchedules: (state) => {
        return state.schedules;
      },
      // 获取今日日程
      todaySchedules: (state) => {
        const today = /* @__PURE__ */ new Date();
        today.setHours(0, 0, 0, 0);
        return state.schedules.filter((schedule) => {
          const scheduleDate = new Date(schedule.date);
          scheduleDate.setHours(0, 0, 0, 0);
          return scheduleDate.getTime() === today.getTime();
        }).sort((a, b) => {
          return /* @__PURE__ */ new Date(`${a.date}T${a.startTime}`) - /* @__PURE__ */ new Date(`${b.date}T${b.startTime}`);
        });
      },
      // 获取本周日程
      weekSchedules: (state) => {
        const today = /* @__PURE__ */ new Date();
        const firstDayOfWeek = new Date(today);
        const day = today.getDay() || 7;
        firstDayOfWeek.setDate(today.getDate() - day + 1);
        firstDayOfWeek.setHours(0, 0, 0, 0);
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
        lastDayOfWeek.setHours(23, 59, 59, 999);
        return state.schedules.filter((schedule) => {
          const scheduleDate = new Date(schedule.date);
          return scheduleDate >= firstDayOfWeek && scheduleDate <= lastDayOfWeek;
        }).sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
          }
          return /* @__PURE__ */ new Date(`${a.date}T${a.startTime}`) - /* @__PURE__ */ new Date(`${b.date}T${b.startTime}`);
        });
      },
      // 获取指定日期的日程
      schedulesByDate: (state) => (date) => {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        return state.schedules.filter((schedule) => {
          const scheduleDate = new Date(schedule.date);
          scheduleDate.setHours(0, 0, 0, 0);
          return scheduleDate.getTime() === targetDate.getTime();
        }).sort((a, b) => {
          return /* @__PURE__ */ new Date(`${a.date}T${a.startTime}`) - /* @__PURE__ */ new Date(`${b.date}T${b.startTime}`);
        });
      },
      // 获取指定ID的日程
      scheduleById: (state) => (id) => {
        return state.schedules.find((schedule) => schedule.id === id);
      }
    },
    mutations: {
      // 设置所有日程
      setSchedules(state, schedules) {
        state.schedules = schedules;
      },
      // 添加日程
      addSchedule(state, schedule) {
        schedule.id = Date.now().toString();
        state.schedules.push(schedule);
        uni.setStorageSync("schedules", state.schedules);
      },
      // 更新日程
      updateSchedule(state, updatedSchedule) {
        const index = state.schedules.findIndex((s) => s.id === updatedSchedule.id);
        if (index !== -1) {
          state.schedules[index] = updatedSchedule;
          uni.setStorageSync("schedules", state.schedules);
        }
      },
      // 删除日程
      deleteSchedule(state, scheduleId) {
        state.schedules = state.schedules.filter((s) => s.id !== scheduleId);
        uni.setStorageSync("schedules", state.schedules);
      },
      // 设置当前日期
      setCurrentDate(state, date) {
        state.currentDate = date;
      }
    },
    actions: {
      // 从本地存储加载日程
      loadSchedules({ commit }) {
        const schedules = uni.getStorageSync("schedules") || [];
        commit("setSchedules", schedules);
      },
      // 添加新日程
      addNewSchedule({ commit }, schedule) {
        commit("addSchedule", schedule);
      },
      // 更新日程
      updateExistingSchedule({ commit }, schedule) {
        commit("updateSchedule", schedule);
      },
      // 删除日程
      removeSchedule({ commit }, scheduleId) {
        commit("deleteSchedule", scheduleId);
      }
    }
  });
  function createApp() {
    const app = vue.createVueApp(App);
    app.use(store);
    return {
      app,
      store
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
