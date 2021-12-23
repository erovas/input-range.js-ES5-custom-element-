/*!
 * input-range.js v1.0.0 for ES5CustomElements.js
 * [Back-compatibility: IE11+] require CustomElements polyfill
 * Copyright (c) 2021, Emanuel Rojas Vásquez
 * BSD 3-Clause License
 * https://github.com/erovas/input-range.js
 */
(function(window, document){

    //#region VARIABLES

    // Constantes Generales
    let TEMPLATE = document.createElement('template');
    let INPUT = 'input';
    let COMPONENT_NAME = INPUT + '-range';
    let INPUT_RANGES_ELEMENTS = document.getElementsByTagName(COMPONENT_NAME);
    let VALUE = 'value';
    let NAME = 'name';
    let MIN = 'min';
    let MAX = 'max';
    let STEP = 'step';
    let DISABLED = 'disabled';
    let IS_CONNECTED = 'isConnected';
    let TAB_INDEX = 'tabIndex';
    let INPUT_THUMB = INPUT + '-thumb';
    let OBSERVED_ATTRIBUTES = [NAME, VALUE, MAX, MIN, STEP];

    // Descriptores
    let INPUT_INTERFACE = HTMLInputElement;
    let VALUE_NATIVE = getDescriptor(INPUT_INTERFACE, VALUE);
    let NAME_NATIVE = getDescriptor(INPUT_INTERFACE, NAME);
    let MIN_NATIVE = getDescriptor(INPUT_INTERFACE, MIN);
    let MAX_NATIVE = getDescriptor(INPUT_INTERFACE, MAX);
    let STEP_NATIVE = getDescriptor(INPUT_INTERFACE, STEP);
    //let DISABLED_NATIVE = getDescriptor(INPUT_INTERFACE, DISABLED);

    // Privados
    let _Xp = '-';
    let _Yp = '-a';
    let _referenceInput = '-b';
    let _referenceThumb = '-c';
    let _referenceLower = '-d';
    let _widthThumb = '-e';
    let _heightThumb = '-f';
    let _widthRange = '-g';
    let _heightRange = '-h';
    let _oldVALUE = '-i'
    let _render = '-j';
    let _outBound = "-k";
    let _outX = "-l";
    let _outY = "-m";

    // Eventos
    let CHANGE_EVENT = new Event('change');
    let INPUT_EVENT = new Event(INPUT);
    let MOUSEDOWN = 'mousedown';
    let TOUCHSTART = 'touchstart';
    let MOUSEMOVE = 'mousemove';
    let TOUCHMOVE = 'touchmove';
    let MOUSEUP = 'mouseup';
    let TOUCHEND = 'touchend';
    let PASSIVE = { passive: false };

    // Auxiliares reutilizables
    let that;
    let input;
    let alpha;
    let deg;
    let rect;
    let left;
    let right;
    let top;
    let bottom;
    let oldValue;
    let newValue;
    let debounced;

    //#endregion

    let input_range = {
        
        Extends: HTMLElement,

        Constructor: function(){
            let that = this;

            let input = that[_referenceInput] = document.createElement('input');
            input.type = 'range';
            input.style.display = 'none';

            // <input> redefinition
            Object.defineProperties(input, {

                tagName: {
                    get: function(){
                        return that.tagName
                    }
                },

                /*innerHTML: {
                    get: function(){
                        return that.innerHTML;
                    }
                },*/

                outerHTML: {
                    get: function(){
                        return that.outerHTML;
                    },
                    set: function(value){
                        that.outerHTML = value;
                    }
                },

                name: {
                    get: function(){
                        return NAME_NATIVE.get.call(input);
                    },
                    set: function(value){
                        setAttribute(that, NAME, value);
                    }
                },

                value: {
                    get: function(){
                        return StringToNumber(VALUE_NATIVE.get.call(input));
                    },
                    set: function(value){
                        setAttribute(that, VALUE, value);
                    }
                },

                min: {
                    get: function(){
                        return StringToNumber(MIN_NATIVE.get.call(input)) || 0;
                    },
                    set: function(value){
                        setAttribute(that, MIN, value);
                    }
                },

                max: {
                    get: function(){
                        return StringToNumber(MAX_NATIVE.get.call(input)) || 100;
                    },
                    set: function(value){
                        setAttribute(that, MAX, value);
                    }
                },

                step: {
                    get: function(){
                        return StringToNumber(STEP_NATIVE.get.call(input)) || 1;
                    },
                    set: function(value){
                        setAttribute(that, STEP, value);
                    }
                },

                disabled: {
                    get: function(){
                        return that[DISABLED];
                    },
                    set: function(value){
                        that[DISABLED] = value;
                    }
                },

                addEventListener: {
                    value: function(event, callback, options){
                        addEvent(that, event, callback, options);
                    }
                },

                removeEventListener: {
                    value: function(event, callback, options){
                        removeEvent(that, event, callback, options);
                    }
                },

            });

            //Events for functionality
            addEvent(that, MOUSEDOWN, _drogInit);
            addEvent(that, TOUCHSTART, _drogInit, PASSIVE);
            addEvent(that, 'keydown', function(e){
                let tempKey = e.which
                if(tempKey > 36 && tempKey < 41 && !that[DISABLED]){

                    e.preventDefault();

                    //Tecla hacia la derecha o hacia arriba
                    if(tempKey > 37 && tempKey < 40)
                        tempKey = that[VALUE] + that[STEP];
                    //Tecla hacia la izquierda o hacia abajo
                    else
                        tempKey = that[VALUE] - that[STEP];

                    //Por el caso de decimales por ejemplo 1.000000000002 > 1
                    tempKey = fixedDecimals(tempKey, that[STEP]);

                    if(tempKey < that[MIN] || tempKey > that[MAX])
                        return;

                    that[VALUE] = tempKey;

                    that.dispatchEvent(INPUT_EVENT);
                    that.dispatchEvent(CHANGE_EVENT);
                }
            });

            //addEvent(that, 'focus', function(){
                //si <input-range> esta disabled, saltar el focus al siguiente elemento
            //});
        },

        Static: {
            get observedAttributes(){
                return OBSERVED_ATTRIBUTES;
            }
        },

        connectedCallback: function(){
            let that = this;

            if(!that[_render]){
                
                that[_render] = true;

                //NOTA: Si se hace un innerHTML, provoca un desbordamiento de llamada de pila en IE11 con el "attributeChangedCallback"
                //por tanto, para evitar eso, utilizar <template> o agregar nodos, como se hace aqui
                if(TEMPLATE.content)
                    that.appendChild(TEMPLATE.content.cloneNode(true));
                else { // IE11, polyfill burdo para salir del paso
                    let children = TEMPLATE.children;
                    for (let i = 0; i < children.length; i++) {
                        that.appendChild(children[i].cloneNode(true));
                    }
                }

                that.appendChild(that[_referenceInput]);

                //Save <input-thumb> reference
                that[_referenceThumb] = querySelector(that, INPUT_THUMB);

                //Save <input-lower> reference
                that[_referenceLower] = querySelector(that, INPUT + '-lower');

                if(!that.hasAttribute(TAB_INDEX))
                    that[TAB_INDEX] = 0;
            }

            // "Fix" for Firefox
            setTimeout(function(){_setComputedPosition(that)}, 20);
        },

        attributeChangedCallback: function(name, oldValue, newValue){

            if(oldValue === newValue)
                return;

            that = this;
            input = that[_referenceInput];
            
            if(name === NAME){
                NAME_NATIVE.set.call(input, newValue);
                return;
            }

            let formatedValue = StringToNumber(newValue)

            if(name === MIN)
                MIN_NATIVE.set.call(input, formatedValue);
            else if(name === MAX)
                MAX_NATIVE.set.call(input, formatedValue);
            else if(name === VALUE)
                VALUE_NATIVE.set.call(input, formatedValue);
            else
                STEP_NATIVE.set.call(input, formatedValue);

            // NO hacer calculos de posicion del thumb y demas, porque el elemento o bien NO está renderizado, o bien
            // esta fuera del DOM
            if(!that[_render] || !that[IS_CONNECTED])
                return;

            _setComputedPosition(that);
        },

        get innerHTML(){
            return '';
        },

        set innerHTML(value){
            //Do nothing
        },

        get outerHTML(){

            let attrs = this.attributes
            let str = '<' + COMPONENT_NAME + ' ';

            for (let i = 0; i < attrs.length; i++) {
                let attr = attrs[i];
                str += attr.name + '="' + attr.value + '" '
            }

            return str + '>' + '</' + COMPONENT_NAME + '>';
        },

        get disabled(){
            return this.hasAttribute(DISABLED);
        },

        set disabled(value){
            if(!!value)
                setAttribute(this, DISABLED, '');
            else
                this.removeAttribute(DISABLED);
        },

    };

    OBSERVED_ATTRIBUTES.forEach(function(prop){
        Object.defineProperty(input_range, prop, {
            get: function(){
                return this[_referenceInput][prop]
            }, 
            set: function(value){
                setAttribute(this, prop, value);
            }
        });
    });

    TEMPLATE.innerHTML = "<input-track><input-lower></input-lower><input-upper></input-upper></input-track><input-thumb></input-thumb>";

    //Registrar componente
    ES5customElements.define(COMPONENT_NAME, input_range);

    //Si el tamaño del input-range depende del tamaño del browser, entonces, setear la posicion del thumb
    addEvent(window, 'resize', function(){

        if(debounced)
            clearTimeout(debounced);

        debounced = setTimeout(function(){
            for (let i = 0; i < INPUT_RANGES_ELEMENTS.length; i++) {
                that = INPUT_RANGES_ELEMENTS[i];
                
                if(!that[_render] || !that[IS_CONNECTED])
                    continue;

                _setComputedPosition(that);
            }
        }, 100);
    });

    /**
     * 
     * @param {HTMLElement} element 
     * @param {string} width 
     * @param {string} height 
     */
    function _getComputedStyles(element, width, height, that){
        let computed = getComputedStyle(element);
        that[width] = parseFloat(computed.width);
        that[height] = parseFloat(computed.height);
    }

    function _getComputed(that){
        //Obtener ancho y alto del input-range
        _getComputedStyles(that, _widthRange, _heightRange, that);
        //Obtener ancho y alto del input-thumb
        _getComputedStyles(that[_referenceThumb], _widthThumb, _heightThumb, that);
    }

    /**
     * 
     * @param {HTMLElement} that 
     */
    function _setComputedPosition(that){
        //Establecer posicion del input-lower y del input-thumb
        _getComputed(that);
        _setPosition(that);
    }

    /**
     * 
     * @param {HTMLElement} that 
     */
    function _setPosition(that){
        that[_Xp] = positionFromValue(that[VALUE], that[_widthRange], that[MIN], that[MAX]);
        that[_referenceLower].style.width = Math.round(that[_Xp]) + 'px';
        that[_referenceThumb].style.transform = 'translate(' + clamp(that[_Xp] - that[_widthThumb] / 2, 0, that[_widthRange] - that[_widthThumb]) + 'px, -50%)'
    }

    /**
     * 
     * @param {HTMLElement} that 
     * @param {Number} alpha 
     * @returns 
     */
    function _getPosition(that, alpha){
        return that[_Xp] * Math.cos(alpha) + that[_Yp] * Math.sin(alpha);
    }

    /**
     * 
     * @param {HTMLElement} that 
     * @param {event} e 
     * @returns 
     */
    function _calculatePosition(that, e){

        if(e.type === MOUSEMOVE || e.type === MOUSEDOWN){
            //Fuera del browser, NO ejecutar
            if(!e.pageY || !e.pageX) return;

            that[_Xp] = e.pageX;
            that[_Yp] = e.pageY;
        }
        else { //multi-touch
            that[_Xp] = e.targetTouches[0].pageX;
            that[_Yp] = e.targetTouches[0].pageY;
        }
        
        _getComputed(that);

        let angleScale = getAngleRotationAndScale(that);
        alpha = angleScale.rotation;
        deg = radiansToDegrees(alpha);
        rect = that.getBoundingClientRect();

        left = rect.left + pageXOffset;
        right = rect.right + pageXOffset;
        top = rect.top + pageYOffset;
        bottom = rect.bottom + pageYOffset;

        //let XoffsetByHeightInput = that[_heightRange] * angleScale.scaleY * Math.cos(Math.PI / 2 - alpha);
        let XoffsetByHeightInput = that[_heightRange] * angleScale.scaleY * Math.sin(alpha);

        if(deg === 0 || deg === 360){
            that[_Xp] -= left;
        }
        else if(deg === 90){
            that[_Xp] = that[_Yp] - top;
        }
        else if(deg === 180){
            that[_Xp] = right - that[_Xp]
        }
        else if(deg === 270){
            that[_Xp] = bottom - that[_Yp];
        }
        else if(deg < 90){
            that[_Xp] -= left + XoffsetByHeightInput;
            that[_Yp] -= top;
            that[_Xp] = _getPosition(that, alpha);
        }
        else if(deg < 180){
            that[_Xp] -= right - XoffsetByHeightInput;
            that[_Yp] -= top;
            that[_Xp] = _getPosition(that, alpha);
        }
        else if(deg < 270){
            that[_Xp] -= right + XoffsetByHeightInput;
            that[_Yp] -= bottom;
            that[_Xp] = _getPosition(that, alpha);
        }
        else { // deg < 360
            that[_Xp] -= left - XoffsetByHeightInput;
            that[_Yp] -= bottom;
            that[_Xp] = _getPosition(that, alpha);
        }

        //Compensar el factor de escala si se a hecho una transformación con CSS sobre el input_range
        that[_Xp] /= angleScale.scaleX;
    }

    /**
     * 
     * @param {HTMLElement} that 
     */
    function _setCalculatePosition(that){
        //Para comparar con el nuevo valor y si son diferentes, disparar evento
        oldValue = that[VALUE]

        newValue = valueFromPosition(that[_Xp], that[_widthRange], that[MIN], that[MAX], that[STEP]);
        VALUE_NATIVE.set.call(that[_referenceInput], newValue)

        if(oldValue !== that[VALUE]){
            _setPosition(that);
            that.dispatchEvent(INPUT_EVENT);
        }
    }

    /**
     * 
     * @param {HTMLElement} that 
     */
    function _removeEvents(that){
        removeEvent(document, MOUSEMOVE, _drogMove);
        removeEvent(that, TOUCHMOVE, _drogMove, PASSIVE);
        removeEvent(document, MOUSEUP, _drogEnd);
        removeEvent(that, TOUCHEND, _drogEnd, PASSIVE);
    }

    function _drogInit(e){

        //Fire by central or left click, avoid it
        if(e.which === 2 || e.which === 3)
            return;

        that = this;

        that[_oldVALUE] = that[VALUE];

        // Mimic behaviour PC
        if(e.type === MOUSEDOWN){
            _calculatePosition(that, e);
            _setCalculatePosition(that);
            //e.preventDefault();

            addEvent(document, MOUSEMOVE, _drogMove);
            addEvent(document, MOUSEUP, _drogEnd);
            return;
        }


        // Mimic behaviour Mobile
        if(e.target.closest(INPUT_THUMB) !== that[_referenceThumb]){
            that[_outBound] = true;
            that[_outX] = e.pageX || e.targetTouches[0].pageX;
            that[_outY] = e.pageY || e.targetTouches[0].pageY;

            //Se calcula la posicion que podria tener el input-thumb, si no se mueve el dedo/cursor
            _calculatePosition(that, e);
        }

        addEvent(that, TOUCHMOVE, _drogMove, PASSIVE);
        addEvent(that, TOUCHEND, _drogEnd, PASSIVE);
    }

    function _drogMove(e){

        if(e.type === TOUCHMOVE)
            that = this;

        if(that[_outBound] && ( that[_outX] !== (e.pageX || e.targetTouches[0].pageX) || that[_outY] !== (e.pageY || e.targetTouches[0].pageY) )){
            that[_outBound] = false;
            _removeEvents(that);
            return;
        }

        _calculatePosition(that, e);
        _setCalculatePosition(that);
    }

    function _drogEnd(e){

        if(e.type === TOUCHEND)
            that = this;

        // Evitar disparos de eventos de mouse, si y solo si, este evento es "touchend"
        e.preventDefault();

        if(that[_outBound])
            _setCalculatePosition(that);
        
        if(that[_oldVALUE] !== that[VALUE])
            that.dispatchEvent(CHANGE_EVENT);

        that[_outBound] = false

        _removeEvents(that);
    }

    //#region FUNCIONES UTILES

    /**
     * 
     * @param {HTMLElement} element 
     * @returns 
     */
    function getAngleRotationAndScale(element){
        let matrix = getComputedStyle(element).transform;

        if(matrix === 'none')
            matrix = '(1, 0, 0, 1, 0, 0)';

        matrix = matrix.split('(')[1];
        matrix = matrix.split(')')[0];
        matrix = matrix.split(',');

        return {
            rotation: Math.atan2(matrix[1], matrix[0]),
            scaleX: Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1]),
            scaleY: Math.sqrt(matrix[2] * matrix[2] + matrix[3] * matrix[3])
        }
    }

        /**
     * Pasa de radianes a grados (0 a 360)
     * @param {Number} value 
     */
    function radiansToDegrees(value){

        if(value < 0)
            value += 2 * Math.PI

        return Math.round(value * (180 / Math.PI) );
    }

    /**
     * Agregar evento al elemento aportado
     * @param {HTMLElement} element 
     * @param {String} event 
     * @param {Function} callback 
     * @param {Boolean|Object} opt 
     */
    function addEvent(element, event, callback, opt){
        element.addEventListener(event, callback, opt || false);
    }

    /**
     * Eliminar evento del elemento
     * @param {HTMLElement} element 
     * @param {String} event 
     * @param {Function} callback 
     * @param {Boolean|Object} opt 
     */
    function removeEvent(element, event, callback, opt){
        element.removeEventListener(event, callback, opt || false);
    }

    /**
     * 
     * @param {HTMLElement} element 
     * @param {String} attributeName 
     * @param {String} value 
     */
    function setAttribute(element, attributeName, value){
        element.setAttribute(attributeName, value);
    }

    /**
     * Limitar el input entre un minimo y un maximo
     * @param {Number} input 
     * @param {Number} min 
     * @param {Number} max 
     */
    function clamp(input, min, max){
        return input > max? max : (input < min? min : input)
    }

    /**
     * Fija la cantidad de decimales de un numero de acuerdo a su step
     * @param {Number} value 
     * @param {Number} step 
     * @returns 
     */
    function fixedDecimals(value, step){
        return Number(value.toFixed((step + '').replace('.', '').length - 1));
    }

    /**
     * Obtiene un valor acotado entre un minimo y un maximo, de acuerdo a la posicion,
     * con decimales fijados segun el step
     * @param {Number} position 
     * @param {Number} maxPosition 
     * @param {Number} min 
     * @param {Number} max 
     * @param {Number} step 
     * @returns 
     */
    function valueFromPosition(position, maxPosition, min, max, step){
        return fixedDecimals(step * Math.round(clamp(position, 0, maxPosition) / maxPosition * (max - min) / step) + min, step);
    }

    /**
     * Obtiene la posición de acuerdo al valor
     * @param {Number} value 
     * @param {Number} maxPosition 
     * @param {Number} min 
     * @param {Number} max 
     * @returns 
     */
    function positionFromValue(value, maxPosition, min, max){
        value = (value - min) / (max - min) * maxPosition;
        return isNaN(value)? 0 : value;
    }

    /**
     * 
     * @param {Function} Interface 
     * @param {String} prototypeName 
     * @returns 
     */
    function getDescriptor(Interface, prototypeName){
        return Object.getOwnPropertyDescriptor(Interface.prototype, prototypeName);
    }

    /**
     * 
     * @param {HTMLElement} element 
     * @param {String} selector 
     * @returns 
     */
    function querySelector(element, selector){
        return element.querySelector(selector);
    }

    /**
     * Si es un numero decimal de la forma "3,123", lo pasa a "3.123"
     * @param {String} text 
     * @returns 
     */
    function StringToNumber(text){
        return parseFloat((text+'').replace(',','.'));
    }

    //#endregion

})(window, document);