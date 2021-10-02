# input-range.js
input-range.js is a ES5 custom element, a highly stylizable component with the same functionality as the original input range (mimic iOS and PC behaviour), compatible with all modern browsers from IE11+.

## Compatibility
- Works with all modern browsers from IE11+ (require polyfills, see the source code demo).

## Dependencies
- Requiere [ES5customElements.js](https://github.com/erovas/ES5customElements.js)

## How to use it?

Import first ES5customElements.js and then input-range.js JavaScript library wherever you want into the document before using it.

``` html
<head>
  <script src="ES5customElements.js"></script>
  <script src="input-range.js"></script>  
</head>
<body>
  <input-range min="-10" step="2" max="200" value="7"></input-range>
</body>
```

or

``` html
<head>
</head>
<body>
  <input-range min="-10" step="2" max="200" value="7"></input-range>
  
  <script src="ES5customElements.js"></script>
  <script src="input-range.js"></script>  
</body>
```

or

``` html
<head>
  <script src="ES5customElements.js"></script>
  <script type="module" src="input-range.js"></script>  
</head>
<body>
  <input-range min="-10" step="2" max="200" value="7"></input-range>
</body>
```

or

``` html
<head>
  <script src="ES5customElements.js"></script>
  <script defer src="input-range.js"></script>  
</head>
<body>
  <input-range min="-10" step="2" max="200" value="7"></input-range>
</body>
```

## API

The same as the native input

## Demo

https://erovas.github.io/input-range.js/

## Authors

* **Emanuel Rojas Vásquez** - *Initial work* - [erovas](https://github.com/erovas)

## License

This project is licensed under the BSD 3-Clause License - see the [LICENSE](https://github.com/erovas/input-range.js/blob/main/LICENSE) file for details.

