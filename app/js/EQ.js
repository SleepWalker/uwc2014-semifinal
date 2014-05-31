define(['jquery',
		'backbone',
		'underscore',
		'hbs!tpl/eqControls', 
		'hbs/handlebars',
		'bootstrap-slider',
		'mousewheel',
		"bootstrap"], 
function($, Backbone, _, tpl) {
	var Filter = Backbone.Model.extend({
		filter: null,
		defaults: {
			maxGain: 20,
		},
		initialize: function() {
			this.filter = this.app.audio.getContext().createBiquadFilter();
			this.filter.type = this.filter.PEAKING;
			this.filter.frequency.value = Math.round(this.get('freq'));
			this.filter.Q.value = 2;
			this.filter.gain.value = 0;

			this.listenTo(this, 'change', function() {
				this.filter.gain.value = this.get('gain');
				console.log('\n\nEQ:\nfreq: '+this.get('freq')+'\ngain: '+this.get('gain'));
			});
		}
	});

	var EQBar = Backbone.View.extend({
		template: tpl,
		model: null,

		events: {
			'change .gain': 'onChange',
		},

		initialize: function(options) {
			this.model = options.model;
			this.listenTo(this.app, 'reset', this.remove);
		},

		render: function() {
			this.$el.html(tpl(this.model.attributes));
			return this;
		},

		onChange: function() {
			this.model.set('gain', this.$('.gain').val()*-1);
		}
	});

	var EQCollection = Backbone.Collection.extend({
		model: Filter,

		initialize: function() {
			this.listenTo(this, 'add', this.connect);
		},

		connect: function(model) {
			this.app.audio.connect(model.filter);
		}
	});

	var EQ = Backbone.View.extend({
		id: 'eq',
		className: 'eq',
		collection: new EQCollection,

		events: {
		},

		initialize: function(options)
		{
			this.options = options;
			this.listenTo(this.app, 'beforePlay', this.render);

			this.listenTo(this.collection, 'add', this.add);
		},

		add: function(model) {
			var view = new EQBar({model: model});
			view.render();
			this.$el.append(view.$el);

			var $el = view.$('.gain'), step = -1;
			view.$('.gain').slider()
				.off('slideStop')
				.on('slideStop', function() {
					$(this).change();
				})
			.parent()
				.off('mousewheel')
				.on('mousewheel', function(e) {
					var val = $el.data('slider').getValue()*1 + e.deltaY*step;
					$el.slider('setValue', val);
					$el.val(val).change();

					e.preventDefault();
				})
				;
		},

		render: function() 
		{
			this.app.gui.addTool(this.el);

			var minFreq = Math.log(this.app.audio.spectrum.options.samplerate/this.app.audio.analyser.fftSize),
				maxFreq = Math.log(this.app.audio.spectrum.options.samplerate/2),
				scale = (maxFreq - minFreq) / (this.options.bands-1);

			for(var i = 1; i < this.options.bands+1; i++) {
                var frequency =  Math.exp(minFreq + scale*(i-1));
                console.log('EQ Frequency '+i+': '+frequency)

				this.collection.add({freq: frequency});
			}
			return this;
		}
	});

	return EQ;
});