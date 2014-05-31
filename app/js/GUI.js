define(['jquery',
		'backbone',
		'underscore',
		'text!tpl/mainUI.tpl',
		'text!tpl/loader.tpl',
		'jquery-ui',
		"bootstrap"], 
function($, Backbone, _, guiTpl, loaderTpl) {
	var Loader = Backbone.View.extend({
		el: $('body'),

		initialize: function() {
			this.render();
		},

		show: function()
		{
			this.$el.fadeIn();

			return this;
		},

		hide: function() 
		{
			this.$el.fadeOut();

			return this;
		},

		render: function() {
			var $loader = $(loaderTpl).hide();

			this.setElement($loader[0]);
			$('body').append(this.$el);

			return this;
		}
	});

	var GUI = Backbone.View.extend({
		id: 'gui',
		className: 'gui gui-no-image',

		loader: new Loader,

		events: {
			'click .reset': 'resetPlayer',
			'click .pause': 'pausePlayer',
			'click .choose-file': 'openFileDialog',
			'change #fileField': 'chooseImage'
		},

		initialize: function(options)
		{
			this.listenToOnce(this.app, 'init', this.initGUI);
			this.listenTo(this.app, 'beforePlay', function() {this.$el.removeClass('gui-no-image')})
		},

		initGUI: function()
		{
			var that = this;

			this.app.loadCss('app/css/style.css', function() {
				$('#pageLoader').remove();
			});

			this.render();
			$('body')
				.prepend(this.$el)
				.on('dragover', function() {that.$el.addClass('gui-dnd'); return false;})
				.on('dragleave', function() {that.$el.removeClass('gui-dnd'); return false;})
				;
			this.$el.on('dragover', function() {that.$el.addClass('hover');})
				.on('dragleave', function() {that.$el.removeClass('hover');})
				.on('drop', function(e) {
					e.preventDefault();

					that.$el.removeClass('hover').removeClass('gui-dnd');
					that.chooseImage(e.originalEvent);
				});

		},

		openFileDialog: function() 
		{
			this.$el.find('#fileField').click();
		},

		chooseImage: function(e) 
		{
			var that = this;
			var fileReader = new FileReader(),
				file = (e.dataTransfer || e.target).files[0];
			fileReader.onload = function(e)
			{
				var data = e.target.result;
				that.app.audio.load(data);
				that.app.audio.play();
				that.$el.removeClass('gui-no-image');
			};

			var mime = file.type;
			if(mime != 'audio/mpeg' && mime != 'audio/mp3' && mime.indexOf('ogg') == -1)
			{
				alert('Unsupported file format: ' + mime);
				return;
			}

			fileReader.readAsDataURL(file);
		},

		resetPlayer: function() {
			this.app.audio.stop();
			$('canvas').hide();
			$('audio').hide();
			this.$el.addClass('gui-no-image');
			this.app.trigger('reset');
		},

		pausePlayer: function() {
			this.app.audio.pause();
		},

		/**
		 * Добавляет инструмент на панель инструментов
		 */
		addTool: function(el)
		{
			this.app.trigger('addTool', el);
			var $el = $(el);
			this.$('#tools').append($el);
		},

		loading: function(isLoading)
		{
			isLoading ? this.loader.show() : this.loader.hide();

			return this;
		},

		render: function() 
		{
			this.$el.html(guiTpl);
			return this;
		}
	});

	return GUI;
});