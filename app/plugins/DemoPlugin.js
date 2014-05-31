define(['jquery', 'backbone', 'hbs!./demo/demo'], function($, Backbone, demoTpl) {
	var DemoView = Backbone.View.extend({
		template: demoTpl,

		events: {
			'click button[data-src]': 'loadAudio'
		},

		initialize: function()
		{
			this.app.loadCss(require.toUrl('plugins/demo/demo.css'));
			this.listenToOnce(this.app, 'afterInit', function() {
				$('body').append(this.render().$el);
			});
		},

		loadAudio: function(e)
		{
			var $el = $(e.target);
			if($el.data('src') != '')
			{
				this.app.audio.load($el.data('src'));

                this.app.audio.play();
			}
		},

		render: function()
		{
			this.$el.html(this.template());

			return this;
		}
	});

	return new DemoView();
});