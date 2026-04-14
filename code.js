/**
 * ============================================
 *  PokemonAR.js — Ultra Simple Pokemon AR
 * ============================================
 *  Usage:
 *    <script src="code.js"></script>
 *    <script>
 *      PokemonAR.init({ pokemon: [...] });
 *    </script>
 * ============================================
 */
(function () {
    'use strict';

    /* ===== DEFAULTS ===== */
    var DEFAULTS = {
        marker: 'hiro',
        scale: '0.01 0.01 0.01',
        spinSpeed: 5000,
        bobSpeed: 1500,
        ringRadius: 0.3,
        labelWidth: 2.5
    };

    /* ===== STATE ===== */
    var _pokemon = [];
    var _current = 0;
    var _config = {};

    /* ===== TYPE EMOJIS ===== */
    var EMOJI = {
        GRASS: '🌿', FIRE: '🔥', WATER: '💧', ELECTRIC: '⚡',
        NORMAL: '⭐', PSYCHIC: '🔮', ICE: '❄️', DRAGON: '🐉',
        DARK: '🌙', FAIRY: '✨', FIGHTING: '👊', POISON: '☠️',
        GROUND: '🌍', FLYING: '🕊️', BUG: '🐛', ROCK: '🪨',
        GHOST: '👻', STEEL: '⚙️'
    };

    /* ===== INJECT CSS ===== */
    function injectCSS() {
        var s = document.createElement('style');
        s.textContent =
            'body{margin:0;overflow:hidden;font-family:sans-serif;}' +
            '#par-btns{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:999;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}' +
            '#par-btns button{padding:10px 16px;border:none;border-radius:20px;font-size:14px;font-weight:bold;color:#fff;cursor:pointer;opacity:0.8;transition:all .2s;box-shadow:0 2px 8px rgba(0,0,0,.3);}' +
            '#par-btns button:hover,#par-btns button.active{opacity:1;transform:scale(1.1);}' +
            '#par-info{position:fixed;bottom:14px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.75);color:#fff;padding:10px 24px;border-radius:20px;font-size:13px;z-index:999;pointer-events:none;text-align:center;backdrop-filter:blur(4px);max-width:90vw;}';
        document.head.appendChild(s);
    }

    /* ===== LOAD SCRIPTS ===== */
    function loadScript(src, cb) {
        var s = document.createElement('script');
        s.src = src;
        s.onload = cb;
        s.onerror = function () { console.error('PokemonAR: Failed to load ' + src); };
        document.head.appendChild(s);
    }

    function loadDeps(cb) {
        if (window.AFRAME) {
            loadARJS(cb);
        } else {
            loadScript('https://aframe.io/releases/1.6.0/aframe.min.js', function () {
                loadARJS(cb);
            });
        }
    }

    function loadARJS(cb) {
        if (window.AFRAME && window.AFRAME.components['arjs-look-controls']) {
            cb();
        } else {
            loadScript('https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js', cb);
        }
    }

    /* ===== BUILD BUTTONS ===== */
    function buildButtons() {
        var wrap = document.createElement('div');
        wrap.id = 'par-btns';

        _pokemon.forEach(function (p, i) {
            var btn = document.createElement('button');
            var firstType = p.type.split('/')[0].trim().toUpperCase();
            var emoji = EMOJI[firstType] || '⭐';
            btn.textContent = emoji + ' ' + p.name;
            btn.style.background = p.color;
            btn.addEventListener('click', function () { switchPokemon(i); });
            wrap.appendChild(btn);
        });

        document.body.appendChild(wrap);
    }

    /* ===== BUILD INFO BAR ===== */
    function buildInfo() {
        var div = document.createElement('div');
        div.id = 'par-info';
        div.textContent = '📷 Point camera at Hiro marker';
        document.body.appendChild(div);
    }

    /* ===== BUILD AR SCENE ===== */
    function buildScene() {
        var scene = document.createElement('a-scene');
        scene.setAttribute('vr-mode-ui', 'enabled:false');
        scene.setAttribute('embedded', '');
        scene.setAttribute('arjs', 'sourceType:webcam; debugUIEnabled:false;');

        // --- Assets ---
        var assets = document.createElement('a-assets');
        _pokemon.forEach(function (p, i) {
            var a = document.createElement('a-asset-item');
            a.id = 'par-m' + i;
            a.setAttribute('src', p.model);
            assets.appendChild(a);
        });
        scene.appendChild(assets);

        // --- Lights ---
        var al = document.createElement('a-light');
        al.setAttribute('type', 'ambient');
        al.setAttribute('intensity', '0.9');
        scene.appendChild(al);

        var dl = document.createElement('a-light');
        dl.setAttribute('type', 'directional');
        dl.setAttribute('position', '1 2 1');
        dl.setAttribute('intensity', '0.6');
        scene.appendChild(dl);

        // --- Marker ---
        var marker = document.createElement('a-marker');
        marker.id = 'par-marker';
        marker.setAttribute('preset', _config.marker);
        marker.setAttribute('emitevents', 'true');

        // 3D Model
        var mdl = document.createElement('a-entity');
        mdl.id = 'par-mdl';
        mdl.setAttribute('gltf-model', '#par-m0');
        mdl.setAttribute('scale', _config.scale);
        mdl.setAttribute('animation', 'property:rotation; to:0 360 0; loop:true; dur:' + _config.spinSpeed + '; easing:linear');
        mdl.setAttribute('animation__bob', 'property:position; from:0 0 0; to:0 0.15 0; dir:alternate; loop:true; dur:' + _config.bobSpeed + '; easing:easeInOutSine');
        marker.appendChild(mdl);

        // Dex label
        var dex = document.createElement('a-text');
        dex.id = 'par-dex';
        dex.setAttribute('value', _pokemon[0].dex);
        dex.setAttribute('position', '0 0.8 0');
        dex.setAttribute('align', 'center');
        dex.setAttribute('color', '#FFD700');
        dex.setAttribute('width', '1.5');
        marker.appendChild(dex);

        // Name label
        var nm = document.createElement('a-text');
        nm.id = 'par-name';
        nm.setAttribute('value', _pokemon[0].name);
        nm.setAttribute('position', '0 0.65 0');
        nm.setAttribute('align', 'center');
        nm.setAttribute('color', '#FFFFFF');
        nm.setAttribute('width', _config.labelWidth.toString());
        marker.appendChild(nm);

        // Type label
        var tp = document.createElement('a-text');
        tp.id = 'par-type';
        tp.setAttribute('value', _pokemon[0].type);
        tp.setAttribute('position', '0 0.52 0');
        tp.setAttribute('align', 'center');
        tp.setAttribute('color', _pokemon[0].color);
        tp.setAttribute('width', '1.8');
        marker.appendChild(tp);

        // Ring
        var ring = document.createElement('a-torus');
        ring.id = 'par-ring';
        ring.setAttribute('position', '0 0.005 0');
        ring.setAttribute('rotation', '-90 0 0');
        ring.setAttribute('radius', _config.ringRadius.toString());
        ring.setAttribute('radius-tubular', '0.01');
        ring.setAttribute('color', _pokemon[0].color);
        ring.setAttribute('opacity', '0.5');
        ring.setAttribute('animation', 'property:rotation; from:-90 0 0; to:-90 360 0; loop:true; dur:3000; easing:linear');
        marker.appendChild(ring);

        scene.appendChild(marker);

        // Camera
        var cam = document.createElement('a-entity');
        cam.setAttribute('camera', '');
        scene.appendChild(cam);

        document.body.appendChild(scene);

        // --- Marker Events ---
        marker.addEventListener('markerFound', function () {
            document.getElementById('par-info').textContent = '✨ Wild ' + _pokemon[_current].name + ' appeared!';
        });
        marker.addEventListener('markerLost', function () {
            document.getElementById('par-info').textContent = '📷 Point camera at Hiro marker';
        });
    }

    /* ===== SWITCH POKEMON ===== */
    function switchPokemon(i) {
        _current = i;
        var p = _pokemon[i];

        document.getElementById('par-mdl').setAttribute('gltf-model', '#par-m' + i);
        document.getElementById('par-name').setAttribute('value', p.name);
        document.getElementById('par-dex').setAttribute('value', p.dex);
        document.getElementById('par-type').setAttribute('value', p.type);
        document.getElementById('par-type').setAttribute('color', p.color);
        document.getElementById('par-ring').setAttribute('color', p.color);
        document.getElementById('par-info').textContent = '✨ ' + p.name + ' selected!';

        var btns = document.querySelectorAll('#par-btns button');
        btns.forEach(function (b, idx) {
            b.classList.toggle('active', idx === i);
        });
    }

    /* ===== PUBLIC API ===== */
    window.PokemonAR = {

        /**
         * PokemonAR.init({ pokemon: [...] })
         *
         * @param {Object} opts
         * @param {Array}  opts.pokemon     - [{ name, dex, type, color, model }]
         * @param {string} [opts.marker]    - 'hiro' (default)
         * @param {string} [opts.scale]     - '0.01 0.01 0.01' (default)
         * @param {number} [opts.spinSpeed] - 5000 (default)
         * @param {number} [opts.bobSpeed]  - 1500 (default)
         */
        init: function (opts) {
            if (!opts || !opts.pokemon || !opts.pokemon.length) {
                console.error('PokemonAR: Provide at least 1 pokemon!');
                return;
            }

            _pokemon = opts.pokemon;
            _current = 0;
            _config = {
                marker:     opts.marker     || DEFAULTS.marker,
                scale:      opts.scale      || DEFAULTS.scale,
                spinSpeed:  opts.spinSpeed  || DEFAULTS.spinSpeed,
                bobSpeed:   opts.bobSpeed   || DEFAULTS.bobSpeed,
                ringRadius: opts.ringRadius || DEFAULTS.ringRadius,
                labelWidth: opts.labelWidth || DEFAULTS.labelWidth
            };

            injectCSS();
            loadDeps(function () {
                buildButtons();
                buildInfo();
                buildScene();
            });
        },

        select: function (i) { switchPokemon(i); },
        current: function () { return _current; }
    };

})();
