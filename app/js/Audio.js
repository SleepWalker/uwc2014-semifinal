// TODO: описание каждого файла в шапке
// 
// TODO: модальные окна
// TODO: i18N
// 
// // TODO: спектр в лог. шкалой
// TODO: Подпись частот

(function() {
    "use strict";

    require(['app/config.js'], function(config, loadCss) {
        // инстанс приложения
        var App = {};

        // все вьюхи по дефолту должны иметь связь с классом приложения
        define('App', ['backbone'], function(Backbone){
            Backbone.View = Backbone.View.extend({
                app: App
            });
            Backbone.Collection = Backbone.Collection.extend({
                app: App
            });
            Backbone.Model = Backbone.Model.extend({
                app: App
            });
        });

        require(["jquery", 
                "GUI", 
                "EQ", 
                'backbone', 
                'underscore',
                'loadCss',
                'App'], 
        function($, GUI, EQ, Backbone, _, loadCss) 
        {
            var context, audioEl, canvasEl;

            audioEl = document.getElementById('audio');
            canvasEl = document.getElementById('canvas');
            try {
                // добываем контест для всех операций с аудио
                window.AudioContext = window.AudioContext||window.webkitAudioContext;
                context = new AudioContext();
            } catch(e) {
                alert('Web Audio API не поддерживается в вашем браузере :(');
            }

            // if(location.protocol == 'file:')
            // {
            //     alert('This app should be run at web server in order to support web workers');
            //     return;
            // }

            // if(!window.Worker)
            // {
            //     alert('Sorry, but your browser does not support Web Workers');
            //     return;
            // }

            if(!window.FileReader)
            {
                alert('Sorry, but your browser does not support FileReader');
                return;
            }

            if(document.createElement('span').draggable == 'undefined')
            {
                alert('Sorry, but your browser does not support Drag-n-Drop');
                return;
            }

            var gui,
                Spectrum = {
                    canvas: null,
                    context: null,
                    analyser: null,
                    options: {
                        barWidth: 30, // ширина колонок в спектре
                        barMargin: 2,
                        // число столбиков будет автоматически нормализровано, 
                        // что бы удовлетворять условию: barCount = (2^x)/2
                        // округление происходит в большую сторону
                        barCount: 24,
                        // частота дискритизации звукового файла
                        samplerate: 44100,
                    },

                    init: function(canvas) {
                        this.context = canvas.getContext('2d');
                        this.canvas = canvas;
                    },

                    connect: function(analyser) {
                        this.analyser = analyser;
                        analyser.fftSize = this.nearestPow2(this.options.barCount*2);
                        this.options.barCount = this.analyser.frequencyBinCount;
                        console.log('FFT Size: '+analyser.fftSize+'\nBar Count: '+this.analyser.frequencyBinCount);

                        // adjust canvas width and height
                        this.canvas.height = 500;
                        this.canvas.width = this.options.barCount * (this.options.barWidth + this.options.barMargin);
                        $(this.canvas).show();

                        this.drawSpectrum();
                    },

                    clearCanvas: function() {
                        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    },


                    /**
                     * @param  {int} number число для которого искать следующую степень 2
                     * @return integer возвращает число кратной близжайшему числу в степени 2
                     */
                    nearestPow2: function(number) {
                      return Math.pow( 2, Math.round( Math.log( number ) / Math.log( 2 ) ) ); 
                    },

                    drawSpectrum: function() {
                        requestAnimationFrame($.proxy(this.drawSpectrum, this));
                        this.clearCanvas();

                        var textAreaSize = 75; // место под текст

                        var frequencyDomain = new Uint8Array(this.analyser.frequencyBinCount);
                        this.analyser.getByteFrequencyData(frequencyDomain);

                        for (var i = 0; i < this.analyser.frequencyBinCount; i++) {
                            var amplitude = frequencyDomain[i];
                            var frequency =  i * this.options.samplerate/this.analyser.fftSize;

                            this.context.fillStyle="#3276B1";
                            var gapSize = this.options.barWidth + this.options.barMargin,
                                barStartX = gapSize * i,
                                barStartY = this.canvas.height - textAreaSize;

                            this.context.fillRect(barStartX, barStartY, this.options.barWidth, -amplitude);

                            this.context.font = 'bold 12px Arial';
                            this.placeRotatedText(this.formatFrequency(frequency), barStartX, barStartY, -90);
                        }
                    },

                    /**
                     * Выводит частоту в человекпонятной форме
                     * @param  float frequency частота в Hz
                     * @return string частота
                     */
                    formatFrequency: function(frequency) {
                        var prefix = '';
                        if(frequency > 1000) {
                            frequency = frequency / 1000;
                            prefix = 'k';
                        }
                        return frequency.toFixed(2) + ' ' + prefix + 'Hz';
                    },

                    placeRotatedText: function(text, x, y, angle) {
                        var size = this.context.measureText(text),
                            tx = x+size.width,
                            ty = y;
                        this.context.save();
                        this.context.translate(tx, ty);
                        this.context.rotate(angle * Math.PI / 180);
                        this.context.translate(-tx, -ty);
                        this.context.fillText(text, x, y);
                        this.context.restore();
                    }
                },
                filterChain = [],
                Audio = {
                    source: null,
                    spectrum: Spectrum,
                    analyser: null,

                    /**
                     * Загружает аудио ресурс
                     * @param  file audio/video object
                     * @return {[type]}      [description]
                     */
                    load: function(src) {
                        var that = this;
                        $(audioEl).show();
                        audioEl.src = src;
                        audioEl.controls = true;
                        audioEl.load();

                        Spectrum.init(canvasEl);
                        try {
                            that.source = context.createMediaElementSource(audioEl); 
                        } catch(e) {}
                        App.trigger('hasSource');
                    },

                    /**
                     * Добавляет фильтр в цепь
                     */
                    connect: function(filter) {
                        filterChain.push(filter);
                    },

                    createSource: function(audioData) {
                        this.source = context.createBufferSource();
                        this.source.buffer = audioData;
                    },

                    play: function() {
                        if(audioEl.src == '') {
                            var m = 'Не обходимо выбрать аудио файл';
                            alert(m);
                            throw new Error(m);
                        }

                        var that = this,
                            play = function() {
                                var analyser = context.createAnalyser();
                                that.analyser = analyser;

                                App.trigger('beforePlay');

                                var lastFilter = that.source;
                                for(var i = 0; i < filterChain.length; i++) {
                                    lastFilter.connect(filterChain[i]);
                                    lastFilter = filterChain[i];
                                }

                                lastFilter.connect(analyser);
                                that.spectrum.connect(analyser);

                                analyser.connect(context.destination);
                                audioEl.play();
                                App.trigger('play');
                            }
                        
                        if(this.source) {
                            play();
                        } else {
                            App.on('hasSource', play);
                        }
                    },

                    stop: function() {
                        audioEl.pause();
                        audioEl.currentTime = 0;
                        App.trigger('stop');
                    },

                    pause: function() {
                        if(audioEl.paused) {
                            audioEl.play();
                            App.trigger('play', true);
                        } else {
                            audioEl.pause();
                            App.trigger('pause', true);
                        }
                    },

                    getContext: function() {
                        return context;
                    },
                };

            _.extend(App, Backbone.Events);
            _.extend(App, {
                loadCss: loadCss,
                audio: Audio,
                eq: new EQ({
                    bands: 12,
                }),
                plugins: {},
                gui: new GUI()
            });

            // Добавляем и инициируем плагины
            var inited = 0, 
                len = 0,
                launchApp = function() {
                    App.trigger('beforeInit');
                    App.trigger('init'); // отсюда начинается рендеринг GUI
                    App.trigger('afterInit');
                };

            for (var pluginName in config.plugins)
            {
                len++;
                var className = config.plugins[pluginName].class;
                require(['plugins/'+className], function(Plugin) {
                    App.plugins[className] = Plugin;
                    inited++;

                    if(inited == len)
                        launchApp();
                })
            }

            if(len == 0) // нету плагинов, инициализируем приложение синхронно
                launchApp();
        });
    });
})();