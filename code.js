/**
 * pokemon-ar.js — Ultra simple Pokemon AR library
 *
 * USAGE:
 *   <script src="pokemon-ar.js"></script>
 *   <script>
 *     PokemonAR.init({
 *       pokemon: [
 *         { name: 'BULBASAUR',  dex: '#001', type: 'GRASS / POISON', color: '#4CAF50', model: 'bulbasaur.glb' },
 *         { name: 'CHARMANDER', dex: '#004', type: 'FIRE',           color: '#FF5722', model: 'charmander.glb' },
 *         { name: 'SQUIRTLE',   dex: '#007', type: 'WATER',          color: '#2196F3', model: 'squirtle.glb' }
 *       ]
 *     });
 *   </script>
 */

(function () {
  "use strict";

  // ========== DEFAULT CONFIG ==========
  var DEFAULTS = {
    markerPreset: "hiro",
    modelScale: "0.01 0.01 0.01",
    spinSpeed: 5000,
    bobSpeed: 1500,
    ringRadius: 0.3,
    labelWidth: 2.5,
  };

  // ========== INJECT CSS ==========
  function injectCSS() {
    var css = document.createElement("style");
    css.textContent = [
      "body{margin:0;overflow:hidden;font-family:sans-serif}",
      "#par-btns{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:999;display:flex;gap:8px;flex-wrap:wrap;justify-content:center}",
      "#par-btns button{padding:10px 16px;border:none;border-radius:20px;font-size:14px;font-weight:bold;color:#fff;cursor:pointer;opacity:0.8;transition:all 0.2s;box-shadow:0 2px 8px rgba(0,0,0,0.3)}",
      "#par-btns button:hover,#par-btns button.active{opacity:1;transform:scale(1.1)}",
      "#par-info{position:fixed;bottom:14px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.75);color:#fff;padding:10px 24px;border-radius:20px;font-size:13px;z-index:999;pointer-events:none;text-align:center;backdrop-filter:blur(4px);max-width:90vw}",
    ].join("\n");
    document.head.appendChild(css);
  }

  // ========== LOAD EXTERNAL SCRIPTS ==========
  function loadScript(src, callback) {
    var s = document.createElement("script");
    s.src = src;
    s.onload = callback;
    s.onerror = function () {
      console.error("PokemonAR: Failed to load " + src);
    };
    document.head.appendChild(s);
  }

  function loadDeps(callback) {
    // Load A-Frame first, then AR.js
    if (window.AFRAME) {
      loadARJS(callback);
    } else {
      loadScript("https://aframe.io/releases/1.6.0/aframe.min.js", function () {
        loadARJS(callback);
      });
    }
  }

  function loadARJS(callback) {
    if (window.AFRAME && window.AFRAME.components["arjs-look-controls"]) {
      callback();
    } else {
      loadScript(
        "https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js",
        callback
      );
    }
  }

  // ========== BUILD HTML ==========
  function buildUI(pokemon) {
    // --- Buttons ---
    var btnContainer = document.createElement("div");
    btnContainer.id = "par-btns";

    var emojis = {
      GRASS: "🌿",
      FIRE: "🔥",
      WATER: "💧",
      ELECTRIC: "⚡",
      NORMAL: "⭐",
      PSYCHIC: "🔮",
      ICE: "❄️",
      DRAGON: "🐉",
      DARK: "🌙",
      FAIRY: "✨",
      FIGHTING: "👊",
      POISON: "☠️",
      GROUND: "🌍",
      FLYING: "🕊️",
      BUG: "🐛",
      ROCK: "🪨",
      GHOST: "👻",
      STEEL: "⚙️",
    };

    pokemon.forEach(function (p, i) {
      var btn = document.createElement("button");
      var firstType = p.type.split("/")[0].trim().toUpperCase();
      var emoji = emojis[firstType] || "⭐";
      btn.textContent = emoji + " " + p.name;
      btn.style.background = p.color;
      btn.setAttribute("data-index", i);
      btn.addEventListener("click", function () {
        switchPokemon(i);
      });
      btnContainer.appendChild(btn);
    });

    document.body.appendChild(btnContainer);

    // --- Info bar ---
    var info = document.createElement("div");
    info.id = "par-info";
    info.textContent = "📷 Point camera at Hiro marker";
    document.body.appendChild(info);
  }

  function buildScene(pokemon, config) {
    var scene = document.createElement("a-scene");
    scene.setAttribute("vr-mode-ui", "enabled:false");
    scene.setAttribute("embedded", "");
    scene.setAttribute("arjs", "sourceType:webcam; debugUIEnabled:false;");

    // --- Assets ---
    var assets = document.createElement("a-assets");
    pokemon.forEach(function (p, i) {
      var asset = document.createElement("a-asset-item");
      asset.id = "par-model-" + i;
      asset.setAttribute("src", p.model);
      assets.appendChild(asset);
    });
    scene.appendChild(assets);

    // --- Lights ---
    var ambient = document.createElement("a-light");
    ambient.setAttribute("type", "ambient");
    ambient.setAttribute("intensity", "0.9");
    scene.appendChild(ambient);

    var dir = document.createElement("a-light");
    dir.setAttribute("type", "directional");
    dir.setAttribute("position", "1 2 1");
    dir.setAttribute("intensity", "0.6");
    scene.appendChild(dir);

    // --- Marker ---
    var marker = document.createElement("a-marker");
    marker.setAttribute("preset", config.markerPreset);
    marker.id = "par-marker";
    marker.setAttribute("emitevents", "true");

    // 3D Model
    var mdl = document.createElement("a-entity");
    mdl.id = "par-mdl";
    mdl.setAttribute("gltf-model", "#par-model-0");
    mdl.setAttribute("scale", config.modelScale);
    mdl.setAttribute(
      "animation",
      "property:rotation; to:0 360 0; loop:true; dur:" +
        config.spinSpeed +
        "; easing:linear"
    );
    mdl.setAttribute(
      "animation__bob",
      "property:position; from:0 0 0; to:0 0.15 0; dir:alternate; loop:true; dur:" +
        config.bobSpeed +
        "; easing:easeInOutSine"
    );
    marker.appendChild(mdl);

    // Labels
    var dex = document.createElement("a-text");
    dex.id = "par-dex";
    dex.setAttribute("value", pokemon[0].dex);
    dex.setAttribute("position", "0 0.8 0");
    dex.setAttribute("align", "center");
    dex.setAttribute("color", "#FFD700");
    dex.setAttribute("width", "1.5");
    marker.appendChild(dex);

    var name = document.createElement("a-text");
    name.id = "par-name";
    name.setAttribute("value", pokemon[0].name);
    name.setAttribute("position", "0 0.65 0");
    name.setAttribute("align", "center");
    name.setAttribute("color", "#FFFFFF");
    name.setAttribute("width", config.labelWidth.toString());
    marker.appendChild(name);

    var type = document.createElement("a-text");
    type.id = "par-type";
    type.setAttribute("value", pokemon[0].type);
    type.setAttribute("position", "0 0.52 0");
    type.setAttribute("align", "center");
    type.setAttribute("color", pokemon[0].color);
    type.setAttribute("width", "1.8");
    marker.appendChild(type);

    // Ring
    var ring = document.createElement("a-torus");
    ring.id = "par-ring";
    ring.setAttribute("position", "0 0.005 0");
    ring.setAttribute("rotation", "-90 0 0");
    ring.setAttribute("radius", config.ringRadius.toString());
    ring.setAttribute("radius-tubular", "0.01");
    ring.setAttribute("color", pokemon[0].color);
    ring.setAttribute("opacity", "0.5");
    ring.setAttribute(
      "animation",
      "property:rotation; from:-90 0 0; to:-90 360 0; loop:true; dur:3000; easing:linear"
    );
    marker.appendChild(ring);

    scene.appendChild(marker);

    // Camera
    var cam = document.createElement("a-entity");
    cam.setAttribute("camera", "");
    scene.appendChild(cam);

    document.body.appendChild(scene);

    // --- Marker events ---
    marker.addEventListener("markerFound", function () {
      var p = _state.pokemon[_state.current];
      document.getElementById("par-info").textContent =
        "✨ Wild " + p.name + " appeared!";
    });
    marker.addEventListener("markerLost", function () {
      document.getElementById("par-info").textContent =
        "📷 Point camera at Hiro marker";
    });
  }

  // ========== STATE ==========
  var _state = { pokemon: [], current: 0 };

  function switchPokemon(i) {
    _state.current = i;
    var p = _state.pokemon[i];

    document
      .getElementById("par-mdl")
      .setAttribute("gltf-model", "#par-model-" + i);
    document.getElementById("par-name").setAttribute("value", p.name);
    document.getElementById("par-dex").setAttribute("value", p.dex);
    document.getElementById("par-type").setAttribute("value", p.type);
    document.getElementById("par-type").setAttribute("color", p.color);
    document.getElementById("par-ring").setAttribute("color", p.color);
    document.getElementById("par-info").textContent =
      "✨ " + p.name + " selected!";

    // Highlight active button
    var btns = document.querySelectorAll("#par-btns button");
    btns.forEach(function (b, idx) {
      b.classList.toggle("active", idx === i);
    });
  }

  // ========== PUBLIC API ==========
  window.PokemonAR = {
    /**
     * Initialize the AR scene
     * @param {Object} opts
     * @param {Array}  opts.pokemon - Array of { name, dex, type, color, model }
     * @param {string} [opts.marker='hiro'] - Marker preset
     * @param {string} [opts.scale='0.01 0.01 0.01'] - Model scale
     */
    init: function (opts) {
      opts = opts || {};
      if (!opts.pokemon || !opts.pokemon.length) {
        console.error("PokemonAR: No pokemon provided!");
        return;
      }

      _state.pokemon = opts.pokemon;
      _state.current = 0;

      var config = {
        markerPreset: opts.marker || DEFAULTS.markerPreset,
        modelScale: opts.scale || DEFAULTS.modelScale,
        spinSpeed: opts.spinSpeed || DEFAULTS.spinSpeed,
        bobSpeed: opts.bobSpeed || DEFAULTS.bobSpeed,
        ringRadius: opts.ringRadius || DEFAULTS.ringRadius,
        labelWidth: opts.labelWidth || DEFAULTS.labelWidth,
      };

      injectCSS();
      loadDeps(function () {
        buildUI(_state.pokemon);
        buildScene(_state.pokemon, config);
      });
    },

    // Switch pokemon programmatically
    select: function (i) {
      switchPokemon(i);
    },

    // Get current pokemon index
    current: function () {
      return _state.current;
    },
  };
})();
