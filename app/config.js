define(function() {
	/**
	 * Файл для подключения фильтров, плагинов и настройки импортов
	 */

	requirejs.config({
		baseUrl: 'app/js',

		paths: {
			jquery: '../vendor/jquery.min',
			'jquery-ui': '../vendor/jquery-ui/js/jquery-ui-1.10.4.custom.min',
			mousewheel: '../vendor/jquery.mousewheel',
			serialiazeObject: '../vendor/jquery.serializeObject',
			text: '../vendor/text',
			bootstrap: '../vendor/bootstrap/js/bootstrap.min',
			'bootstrap-slider': '../vendor/bootstrap-slider/js/bootstrap-slider',
			backbone: '../vendor/backbone.min',
			underscore: '../vendor/underscore.min',
			hbs: '../vendor/require-handlebars-plugin/hbs',
			tpl: '../tpl',
			filters: '../filters',
			plugins: '../plugins',
			vendor: '../vendor'
		},

		shim: {
			"bootstrap": {
				deps: ['loadCss', 'jquery'],
				init: function(loadCss)
				{
					loadCss('app/vendor/bootstrap/css/bootstrap.min.css');
				}
			},
			'bootstrap-slider': {
				deps: ['loadCss', 'bootstrap'],
				init: function(loadCss)
				{
					loadCss('app/vendor/bootstrap-slider/css/slider.css');
				}
			},
			"backbone": {
				deps: ['jquery', 'underscore'],
			},
			"jquery-ui": {
				deps: ['jquery'],
			},
			"serialiazeObject": {
				deps: ['jquery'],
			}
		}
	});


	/**
	 * Динамически подгружает css файлы
	 *
	 * @param string url ссылка на цсс файл
	 * @param function func функция, вызываемая после подгрузки стилей (опционально)
	 */
	define('loadCss', function() {
		return function(url, func) {
			var link = document.createElement("link");
			link.type = "text/css";
			link.rel = "stylesheet";
			link.href = url;
			if(func)
				link.onload = func;

			document.getElementsByTagName("head")[0].appendChild(link);
		};
	});

	return {
		/**
		 * Плагины в праве делать все, что угодно. Это могут быть новые элементы тулбара, ресайз, кроп изображения, социальные плагины и прочее
		 *
		 * Для обьявления плагинов используется такой же синтаксис, как и у фильтров.
		 * Плагины должны находиться в директории ./plugins и быть AMD модулями. Модуль должен возвращать инстанс главного класса плагина
		 * @see demo плагин для примера.
		 */
		plugins: {
			'Plugin Demo': {
				class: 'DemoPlugin'
			}
		}
	};
});