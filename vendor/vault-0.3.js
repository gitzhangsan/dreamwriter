// Generated by CoffeeScript 1.3.3
(function() {
  var IdbAdapter, Vault, VaultStore, applyDefaults, debug, defaultOptions, getTransactionMode, root, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Vault = (function() {

    Vault.prototype.stores = {};

    function Vault(options) {
      var db, storeName, storeOptions, _i, _len, _ref, _ref1, _ref2, _ref3,
        _this = this;
      if (options == null) {
        options = {};
      }
      applyDefaults(options, defaultOptions);
      _ref = options.stores;
      for (storeName in _ref) {
        storeOptions = _ref[storeName];
        applyDefaults(storeOptions, options.storeDefaults);
        storeOptions.name = (_ref1 = storeOptions.name) != null ? _ref1 : storeName;
      }
      db = new IdbAdapter(options);
      if (options.stores instanceof Array) {
        _ref2 = options.stores;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          storeName = _ref2[_i];
          storeOptions = applyDefaults({
            name: storeName
          }, options.storeDefaults);
          this.stores[storeName] = new VaultStore(db, storeOptions);
        }
      } else {
        _ref3 = options.stores;
        for (storeName in _ref3) {
          storeOptions = _ref3[storeName];
          this.stores[storeName] = new VaultStore(db, storeOptions);
        }
      }
      db.on('load', function() {
        if (options.onready) {
          return options.onready(_this.stores);
        }
      });
    }

    return Vault;

  })();

  defaultOptions = {
    name: 'vault',
    stores: {},
    storeDefaults: {
      keyName: 'key'
    }
  };

  applyDefaults = function(object, defaults) {
    var key, value;
    for (key in defaults) {
      value = defaults[key];
      if (object[key] == null) {
        object[key] = defaults[key];
      }
    }
    return object;
  };

  if (typeof module !== "undefined" && module !== null) {
    module.exports = Vault;
  }

  if (typeof window !== "undefined" && window !== null) {
    window.Vault = Vault;
  }

  root = (_ref = typeof window !== "undefined" && window !== null ? window : exports) != null ? _ref : this;

  IdbAdapter = (function() {

    function IdbAdapter(options) {
      this.openCursor = __bind(this.openCursor, this);

      this.dbDo = __bind(this.dbDo, this);

      this.getStore = __bind(this.getStore, this);

      this.doWhenReady = __bind(this.doWhenReady, this);

      this.fireEvent = __bind(this.fireEvent, this);

      this.off = __bind(this.off, this);

      this.on = __bind(this.on, this);

      var onload, problem, problems, request, upgrade, _i, _len, _ref1, _ref2, _ref3, _ref4, _ref5,
        _this = this;
      applyDefaults(options, defaultOptions);
      this.eventListeners = {};
      this.deferredUntilLoad = [];
      this.loaded = false;
      root.indexedDB = root.indexedDB || root.webkitIndexedDB || root.mozIndexedDB || root.msIndexedDB;
      root.IDBTransaction = (_ref1 = root.IDBTransaction) != null ? _ref1 : root.webkitIDBTransaction;
      root.IDBKeyRange = (_ref2 = root.IDBKeyRange) != null ? _ref2 : root.webkitIDBKeyRange;
      root.storageInfo = (_ref3 = root.storageInfo) != null ? _ref3 : root.webkitStorageInfo;
      problems = [];
      if (!root.indexedDB) {
        problems.push("Could not initialize IndexedDB - no indexedDB present");
      }
      if (!root.IDBTransaction) {
        problems.push("Could not initialize IndexedDB - no IDBTransaction present");
      }
      if (!root.IDBKeyRange) {
        problems.push("Could not initialize IndexedDB - no IDBKeyRange present");
      }
      if (!!problems.length) {
        for (_i = 0, _len = problems.length; _i < _len; _i++) {
          problem = problems[_i];
          console.error(problem);
        }
        return;
      }
      if ((_ref4 = root.storageInfo) != null) {
        _ref4.requestQuota((_ref5 = root.storageInfo) != null ? _ref5.TEMPORARY : void 0, options.desiredQuotaBytes);
      }
      upgrade = function(event) {
        var store, storeName, _j, _len1, _ref6, _ref7;
        _this.fireEvent('upgrade');
        debug(function() {
          return "Creating database...";
        });
        if (options.stores instanceof Array) {
          _ref6 = options.stores;
          for (_j = 0, _len1 = _ref6.length; _j < _len1; _j++) {
            storeName = _ref6[_j];
            _this.db.createObjectStore(storeName, {
              keyPath: 'id'
            });
          }
        } else {
          _ref7 = options.stores;
          for (storeName in _ref7) {
            store = _ref7[storeName];
            _this.db.createObjectStore(storeName, {
              keyPath: store.keyName
            });
          }
        }
        return debug(function() {
          return "Success. Database now at version \"" + options.version + "\"";
        });
      };
      onload = function(event) {
        var deferred, _j, _len1, _ref6;
        _ref6 = _this.deferredUntilLoad;
        for (_j = 0, _len1 = _ref6.length; _j < _len1; _j++) {
          deferred = _ref6[_j];
          deferred();
        }
        _this.loaded = true;
        return _this.fireEvent('load');
      };
      debug(function() {
        return "Attempting to open db version " + options.version;
      });
      request = root.indexedDB.open(options.name, options.version);
      request.onupgradeneeded = function(event) {
        _this.db = event.target.result;
        return upgrade(event);
      };
      request.onerror = this.onerror;
      request.onsuccess = function(e) {
        var setVersionRequest;
        _this.db = e.target.result;
        if (_this.db.version) {
          debug(function() {
            return "Opened db ver " + _this.db.version;
          });
        } else {
          debug(function() {
            return "Opened new db";
          });
        }
        _this.db.onerror = _this.onerror;
        _this.db.onversionchange = function(event) {
          _this.db.close();
          throw "An unexpected database version change occurred.";
        };
        if ((_this.db.setVersion != null) && _this.db.version !== options.version) {
          setVersionRequest = _this.db.setVersion(options.version);
          setVersionRequest.onerror = _this.onerror;
          return setVersionRequest.onsuccess = function(event) {
            upgrade(event);
            return setVersionRequest.result.oncomplete = onload;
          };
        } else {
          return onload();
        }
      };
    }

    IdbAdapter.prototype.onerror = function(event) {
      var msg, _ref1, _ref2;
      console.error(event);
      msg = (_ref1 = event != null ? (_ref2 = event.target) != null ? _ref2.webkitErrorMessage : void 0 : void 0) != null ? _ref1 : 'see console log for details';
      throw "IndexedDB Error Code " + event.target.errorCode + " - " + msg;
    };

    IdbAdapter.prototype.on = function(event, handler) {
      var listeners;
      if (typeof handler !== 'function') {
        throw "Invalid handler function for event " + event + ": " + handler;
      }
      listeners = this.eventListeners[event];
      if (listeners) {
        return listeners.unshift(handler);
      } else {
        return this.eventListeners[event] = [handler];
      }
    };

    IdbAdapter.prototype.off = function(event, handler) {
      var currentHandler, listener, value, _i, _len, _ref1, _ref2, _results, _results1;
      if (handler) {
        _ref1 = this.eventListeners[event];
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          currentHandler = _ref1[_i];
          if (handler === currentHandler) {
            throw "unsupported";
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      } else if (event) {
        return this.eventListeners[event] = [];
      } else {
        _ref2 = this.eventListeners;
        _results1 = [];
        for (listener in _ref2) {
          value = _ref2[listener];
          _results1.push(this.eventListeners[listener] = []);
        }
        return _results1;
      }
    };

    IdbAdapter.prototype.fireEvent = function(eventName, event) {
      var closure, listeners, _i, _len, _results;
      listeners = this.eventListeners[eventName];
      if (listeners) {
        _results = [];
        for (_i = 0, _len = listeners.length; _i < _len; _i++) {
          closure = listeners[_i];
          if (closure) {
            _results.push(closure(event));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    };

    IdbAdapter.prototype.doWhenReady = function(closure) {
      if (!this.loaded) {
        return this.deferredUntilLoad.unshift(closure);
      } else {
        return closure();
      }
    };

    IdbAdapter.prototype.getStore = function(storeName, mode, onTransactionComplete, onError) {
      var transaction;
      if (onError == null) {
        onError = this.onerror;
      }
      try {
        transaction = this.db.transaction([storeName], mode);
        transaction.onerror = onError;
        transaction.oncomplete = onTransactionComplete;
        return transaction.objectStore(storeName);
      } catch (err) {
        console.error("Could not get store " + storeName + " in mode " + mode);
        throw err;
      }
    };

    IdbAdapter.prototype.dbDo = function(storeName, method, value, onSuccess, onError, onTransactionComplete, mode) {
      var _this = this;
      if (onError == null) {
        onError = this.onerror;
      }
      if (mode == null) {
        mode = getTransactionMode(method);
      }
      return this.doWhenReady(function() {
        var request, store;
        store = _this.getStore(storeName, mode, onTransactionComplete, onError);
        if (!store[method]) {
          throw "Store " + store + " does not have a method " + method;
        }
        debug(function() {
          return "" + storeName + "." + method + "(" + (value != null ? value : '') + ")";
        });
        try {
          if (!(value != null)) {
            request = store[method].call(store);
          } else if (value instanceof Array) {
            request = store[method].apply(store, value);
          } else {
            request = store[method].call(store, value);
          }
        } catch (err) {
          console.error("Could not execute " + storeName + "." + method + " with value:");
          console.error(err);
          console.error(value);
        }
        request.onsuccess = onSuccess;
        request.onerror = onError;
        return _this.fireEvent(method, value);
      });
    };

    IdbAdapter.prototype.openCursor = function(storeName, onSuccess, onError, readOnly) {
      var method;
      if (readOnly == null) {
        readOnly = true;
      }
      method = readOnly ? "readonly" : "readwrite";
      return this.dbDo(storeName, 'openCursor', void 0, onSuccess, onError, void 0, method);
    };

    return IdbAdapter;

  })();

  getTransactionMode = function(method) {
    if (method === 'put' || method === 'add' || method === 'delete' || method === 'clear') {
      return "readwrite";
    } else {
      return "readonly";
    }
  };

  debug = function(getMessage) {
    var _ref1;
    if (root != null ? root.debug : void 0) {
      return root != null ? (_ref1 = root.console) != null ? _ref1.debug(getMessage()) : void 0 : void 0;
    }
  };

  defaultOptions = {
    name: 'vault',
    version: '1',
    desiredQuotaBytes: 1024 * 1024 * 1024 * 1024,
    stores: {}
  };

  if (typeof module !== "undefined" && module !== null) {
    module.exports = IdbAdapter;
  }

  if (typeof window !== "undefined" && window !== null) {
    window.IdbAdapter = IdbAdapter;
  }

  VaultStore = (function() {

    VaultStore.prototype.cache = {};

    function VaultStore(db, options) {
      var key, _i, _len, _ref1;
      this.db = db;
      this.deleteEach = __bind(this.deleteEach, this);

      this.each = __bind(this.each, this);

      this.count = __bind(this.count, this);

      this.clear = __bind(this.clear, this);

      this["delete"] = __bind(this["delete"], this);

      this.add = __bind(this.add, this);

      this.put = __bind(this.put, this);

      this.get = __bind(this.get, this);

      this["do"] = __bind(this["do"], this);

      _ref1 = ['name', 'keyName'];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        key = _ref1[_i];
        this[key] = options[key];
      }
      if (!this.name) {
        throw "Cannot create a store with name " + this.name;
      }
    }

    VaultStore.prototype["do"] = function(method, args, success, error, cache) {
      var convertedSuccess,
        _this = this;
      convertedSuccess = function(response) {
        var _ref1;
        if (success) {
          return success(response != null ? (_ref1 = response.target) != null ? _ref1.result : void 0 : void 0);
        }
      };
      return this.db.dbDo(this.name, method, args, convertedSuccess, error);
    };

    VaultStore.prototype.get = function(id, success, error, cache) {
      if (id == null) {
        throw "Cannot get " + id + " from " + this.name;
      }
      return this["do"]('get', id, success, error, cache);
    };

    VaultStore.prototype.put = function(obj, success, error, cache) {
      if (obj == null) {
        throw "Cannot put " + obj + " into " + this.name;
      }
      return this["do"]('put', obj, success, error, cache);
    };

    VaultStore.prototype.add = function(obj, success, error, cache) {
      if (obj == null) {
        throw "Cannot add " + obj + " to " + this.name;
      }
      return this["do"]('add', obj, success, error, cache);
    };

    VaultStore.prototype["delete"] = function(id, success, error, cache) {
      if (id == null) {
        throw "Cannot delete " + id + " from " + this.name;
      }
      return this["do"]('delete', id, success, error, cache);
    };

    VaultStore.prototype.clear = function(success, error) {
      var _this = this;
      return this["do"]('clear', void 0, (function(response) {
        _this.cache = {};
        if (success) {
          return success(response);
        }
      }), error);
    };

    VaultStore.prototype.count = function(success, error, cache) {
      var count;
      count = 0;
      return this.each((function() {
        return count++;
      }), (function() {
        if (success) {
          return success(count);
        }
      }), error, cache);
    };

    VaultStore.prototype.each = function(iterator, success, error, cache) {
      var cursorIterator, key, stopFunction, stopper, value, _ref1;
      if (cache) {
        _ref1 = this.db.cache[this.name];
        for (key in _ref1) {
          value = _ref1[key];
          stopper = {};
          stopFunction = function() {
            return stopper.stop = true;
          };
          iterator(key, value, stopFunction);
          if (stopper.stop) {
            if (success) {
              success();
            }
            return;
          }
        }
        if (success) {
          return success();
        }
      } else {
        cursorIterator = function(event) {
          var cursor, halt;
          cursor = event.target.result;
          if (cursor) {
            halt = false;
            iterator(cursor.key, cursor.value, (function() {
              return halt = true;
            }));
            if (halt) {
              if (success) {
                return success();
              }
            } else {
              return cursor["continue"]();
            }
          } else {
            if (success) {
              return success();
            }
          }
        };
        return this.db.openCursor(this.name, cursorIterator, error);
      }
    };

    VaultStore.prototype.deleteEach = function(iterator, success, error) {
      var cursorIterator;
      cursorIterator = function(event) {
        var cursor, halt, shouldDelete;
        cursor = event.target.result;
        if (cursor) {
          halt = false;
          shouldDelete = iterator(cursor.key, cursor.value, (function() {
            return halt = true;
          }));
          if (halt) {
            if (success) {
              return success();
            }
          } else {
            try {
              if (shouldDelete) {
                cursor["delete"]();
              }
            } catch (err) {
              console.error(err);
            }
            return cursor["continue"]();
          }
        } else {
          if (success) {
            return success();
          }
        }
      };
      return this.db.openCursor(this.name, cursorIterator, error, false);
    };

    return VaultStore;

  })();

  if (typeof module !== "undefined" && module !== null) {
    module.exports = VaultStore;
  }

  if (typeof window !== "undefined" && window !== null) {
    window.VaultStore = VaultStore;
  }

}).call(this);