'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LiquidButton = function () {
  function LiquidButton(svg) {
    _classCallCheck(this, LiquidButton);

    var options = svg.dataset;
    this.id = this.constructor.id || (this.constructor.id = 1);
    this.constructor.id++;
    this.xmlns = 'http://www.w3.org/2000/svg';
    this.tension = options.tension * 1 || 0.4;
    this.width = options.width * 1 || 200;
    this.height = options.height * 1 || 50;
    this.margin = options.margin || 40;
    this.hoverFactor = options.hoverFactor || -0.1;
    this.gap = options.gap || 5;
    this.debug = options.debug || false;
    this.forceFactor = options.forceFactor || 0.2;
    this.color1 = options.color1 || '#36DFE7';
    this.color2 = options.color2 || '#8F17E1';
    this.color3 = options.color3 || '#BF09E6';
    this.textColor = options.textColor || '#FFFFFF';
    this.text = options.text || 'Button';
    this.svg = svg;
    this.layers = [{
      points: [],
      viscosity: 0.5,
      mouseForce: 100,
      forceLimit: 2
    }, {
      points: [],
      viscosity: 0.8,
      mouseForce: 150,
      forceLimit: 3
    }];
    for (var layerIndex = 0; layerIndex < this.layers.length; layerIndex++) {
      var layer = this.layers[layerIndex];
      layer.viscosity = options['layer-' + (layerIndex + 1) + 'Viscosity'] * 1 || layer.viscosity;
      layer.mouseForce = options['layer-' + (layerIndex + 1) + 'MouseForce'] * 1 || layer.mouseForce;
      layer.forceLimit = options['layer-' + (layerIndex + 1) + 'ForceLimit'] * 1 || layer.forceLimit;
      layer.path = document.createElementNS(this.xmlns, 'path');
      this.svg.appendChild(layer.path);
    }
    this.wrapperElement = options.wrapperElement || document.body;
    if (!this.svg.parentElement) {
      this.wrapperElement.append(this.svg);
    }

    this.svgText = document.createElementNS(this.xmlns, 'text');
    this.svgText.setAttribute('x', '50%');
    this.svgText.setAttribute('y', '50%');
    this.svgText.setAttribute('dy', ~ ~(this.height / 8) + 'px');
    this.svgText.setAttribute('font-size', ~ ~(this.height / 3));
    this.svgText.style.fontFamily = 'sans-serif';
    this.svgText.setAttribute('text-anchor', 'middle');
    this.svgText.setAttribute('pointer-events', 'none');
    this.svg.appendChild(this.svgText);

    this.svgDefs = document.createElementNS(this.xmlns, 'defs');
    this.svg.appendChild(this.svgDefs);

    this.touches = [];
    this.noise = options.noise || 0;
    document.body.addEventListener('touchstart', this.touchHandler);
    document.body.addEventListener('touchmove', this.touchHandler);
    document.body.addEventListener('touchend', this.clearHandler);
    document.body.addEventListener('touchcancel', this.clearHandler);
    this.svg.addEventListener('mousemove', this.mouseHandler);
    this.svg.addEventListener('mouseout', this.clearHandler);
    this.initOrigins();
    this.animate();
  }

  LiquidButton.prototype.distance = function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  LiquidButton.prototype.update = function update() {
    for (var layerIndex = 0; layerIndex < this.layers.length; layerIndex++) {
      var layer = this.layers[layerIndex];
      var points = layer.points;
      for (var pointIndex = 0; pointIndex < points.length; pointIndex++) {
        var point = points[pointIndex];
        var dx = point.ox - point.x + (Math.random() - 0.5) * this.noise;
        var dy = point.oy - point.y + (Math.random() - 0.5) * this.noise;
        var d = Math.sqrt(dx * dx + dy * dy);
        var f = d * this.forceFactor;
        point.vx += f * (dx / d || 0);
        point.vy += f * (dy / d || 0);
        for (var touchIndex = 0; touchIndex < this.touches.length; touchIndex++) {
          var touch = this.touches[touchIndex];
          var mouseForce = layer.mouseForce;
          if (touch.x > this.margin && touch.x < this.margin + this.width && touch.y > this.margin && touch.y < this.margin + this.height) {
            mouseForce *= -this.hoverFactor;
          }
          var mx = point.x - touch.x;
          var my = point.y - touch.y;
          var md = Math.sqrt(mx * mx + my * my);
          var mf = Math.max(-layer.forceLimit, Math.min(layer.forceLimit, mouseForce * touch.force / md));
          point.vx += mf * (mx / md || 0);
          point.vy += mf * (my / md || 0);
        }
        point.vx *= layer.viscosity;
        point.vy *= layer.viscosity;
        point.x += point.vx;
        point.y += point.vy;
      }
      for (var pointIndex = 0; pointIndex < points.length; pointIndex++) {
        var prev = points[(pointIndex + points.length - 1) % points.length];
        var point = points[pointIndex];
        var next = points[(pointIndex + points.length + 1) % points.length];
        var dPrev = this.distance(point, prev);
        var dNext = this.distance(point, next);

        var line = {
          x: next.x - prev.x,
          y: next.y - prev.y
        };
        var dLine = Math.sqrt(line.x * line.x + line.y * line.y);

        point.cPrev = {
          x: point.x - line.x / dLine * dPrev * this.tension,
          y: point.y - line.y / dLine * dPrev * this.tension
        };
        point.cNext = {
          x: point.x + line.x / dLine * dNext * this.tension,
          y: point.y + line.y / dLine * dNext * this.tension
        };
      }
    }
  };

  LiquidButton.prototype.animate = function animate() {
    var _this = this;

    this.raf(function () {
      _this.update();
      _this.draw();
      _this.animate();
    });
  };

  LiquidButton.prototype.draw = function draw() {
    for (var layerIndex = 0; layerIndex < this.layers.length; layerIndex++) {
      var layer = this.layers[layerIndex];
      if (layerIndex === 1) {
        if (this.touches.length > 0) {
          while (this.svgDefs.firstChild) {
            this.svgDefs.removeChild(this.svgDefs.firstChild);
          }
          for (var touchIndex = 0; touchIndex < this.touches.length; touchIndex++) {
            var touch = this.touches[touchIndex];
            var gradient = document.createElementNS(this.xmlns, 'radialGradient');
            gradient.id = 'liquid-gradient-' + this.id + '-' + touchIndex;
            var start = document.createElementNS(this.xmlns, 'stop');
            start.setAttribute('stop-color', this.color3);
            start.setAttribute('offset', '0%');
            var stop = document.createElementNS(this.xmlns, 'stop');
            stop.setAttribute('stop-color', this.color2);
            stop.setAttribute('offset', '100%');
            gradient.appendChild(start);
            gradient.appendChild(stop);
            this.svgDefs.appendChild(gradient);
            gradient.setAttribute('cx', touch.x / this.svgWidth);
            gradient.setAttribute('cy', touch.y / this.svgHeight);
            gradient.setAttribute('r', touch.force);
            layer.path.style.fill = 'url(#' + gradient.id + ')';
          }
        } else {
          layer.path.style.fill = this.color2;
        }
      } else {
        layer.path.style.fill = this.color1;
      }
      var points = layer.points;
      var commands = [];
      commands.push('M', points[0].x, points[0].y);
      for (var pointIndex = 1; pointIndex < points.length; pointIndex += 1) {
        commands.push('C', points[(pointIndex + 0) % points.length].cNext.x, points[(pointIndex + 0) % points.length].cNext.y, points[(pointIndex + 1) % points.length].cPrev.x, points[(pointIndex + 1) % points.length].cPrev.y, points[(pointIndex + 1) % points.length].x, points[(pointIndex + 1) % points.length].y);
      }
      commands.push('Z');
      layer.path.setAttribute('d', commands.join(' '));
    }
    this.svgText.textContent = this.text;
    this.svgText.style.fill = this.textColor;
  };

  LiquidButton.prototype.createPoint = function createPoint(x, y) {
    return {
      x: x,
      y: y,
      ox: x,
      oy: y,
      vx: 0,
      vy: 0
    };
  };

  LiquidButton.prototype.initOrigins = function initOrigins() {
    this.svg.setAttribute('width', this.svgWidth);
    this.svg.setAttribute('height', this.svgHeight);
    for (var layerIndex = 0; layerIndex < this.layers.length; layerIndex++) {
      var layer = this.layers[layerIndex];
      var points = [];
      for (var x = ~ ~(this.height / 2); x < this.width - ~ ~(this.height / 2); x += this.gap) {
        points.push(this.createPoint(x + this.margin, this.margin));
      }
      for (var alpha = ~ ~(this.height * 1.25); alpha >= 0; alpha -= this.gap) {
        var angle = Math.PI / ~ ~(this.height * 1.25) * alpha;
        points.push(this.createPoint(Math.sin(angle) * this.height / 2 + this.margin + this.width - this.height / 2, Math.cos(angle) * this.height / 2 + this.margin + this.height / 2));
      }
      for (var x = this.width - ~ ~(this.height / 2) - 1; x >= ~ ~(this.height / 2); x -= this.gap) {
        points.push(this.createPoint(x + this.margin, this.margin + this.height));
      }
      for (var alpha = 0; alpha <= ~ ~(this.height * 1.25); alpha += this.gap) {
        var angle = Math.PI / ~ ~(this.height * 1.25) * alpha;
        points.push(this.createPoint(this.height - Math.sin(angle) * this.height / 2 + this.margin - this.height / 2, Math.cos(angle) * this.height / 2 + this.margin + this.height / 2));
      }
      layer.points = points;
    }
  };

  _createClass(LiquidButton, [{
    key: 'mouseHandler',
    get: function get() {
      var _this2 = this;

      return function (e) {
        _this2.touches = [{
          x: e.offsetX,
          y: e.offsetY,
          force: 1
        }];
      };
    }
  }, {
    key: 'touchHandler',
    get: function get() {
      var _this3 = this;

      return function (e) {
        _this3.touches = [];
        var rect = _this3.svg.getBoundingClientRect();
        for (var touchIndex = 0; touchIndex < e.changedTouches.length; touchIndex++) {
          var touch = e.changedTouches[touchIndex];
          var x = touch.pageX - rect.left;
          var y = touch.pageY - rect.top;
          if (x > 0 && y > 0 && x < _this3.svgWidth && y < _this3.svgHeight) {
            _this3.touches.push({ x: x, y: y, force: touch.force || 1 });
          }
        }
        e.preventDefault();
      };
    }
  }, {
    key: 'clearHandler',
    get: function get() {
      var _this4 = this;

      return function (e) {
        _this4.touches = [];
      };
    }
  }, {
    key: 'raf',
    get: function get() {
      return this.__raf || (this.__raf = (window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
        setTimeout(callback, 10);
      }).bind(window));
    }
  }, {
    key: 'svgWidth',
    get: function get() {
      return this.width + this.margin * 2;
    }
  }, {
    key: 'svgHeight',
    get: function get() {
      return this.height + this.margin * 2;
    }
  }]);

  return LiquidButton;
}();

var redraw = function redraw() {
  button.initOrigins();
};

var buttons = document.getElementsByClassName('liquid-button');
for (var buttonIndex = 0; buttonIndex < buttons.length; buttonIndex++) {
  var _button = buttons[buttonIndex];
  _button.liquidButton = new LiquidButton(_button);
}
////hamburger-button
// Look for .hamburgerFirst
  var hamburger = document.querySelector(".hamburger");
  // On click
  hamburger.addEventListener("click", function() {
    // Toggle class "is-active"
    hamburger.classList.toggle("is-active");
    // Do something else, like open/close menu
  });

/////second-header.scrollify
$(window).on("scroll", function () {
    var scrolled = $(this).scrollTop();
    var width = $(window).width();
    if( scrolled > 150 && width > 500 ) {
        $('.firstNav').addClass('scrolled fixed-top');
    }
    if( scrolled <= 150 ) {
        $('.firstNav').removeClass('scrolled fixed-top');
    }
    if( scrolled > 150 && width > 500) {
        $('.title').addClass('padding');
    }
    if( scrolled <= 150 ) {
        $('.title').removeClass('padding');
    }
});
////remove mobile fixed menu///

// function resizeScrenn(){
//         if ($(window).width() <= 500){
//           $('.firstNav').removeClass('scrolled fixed-top');
//      } else {
//           $('.firstNav').addClass('scrolled fixed-top');
//      }
//       });
//       $(document).ready(function() {
//
//   $(window).resize(function(){
//     var windowWidth = $(window).width();
//     if(windowWidth < 500 ) $(".firstNav").removeClass("scrolled fixed-top");
//     else $(".firstNav").addClass("scrolled fixed-top");
//   });
// });
// $(document).ready(function() {
//     var w = $(window).width(); // Получаем ширину окна
//     if (w <= 500) { // Если ширина окна меньше, либо равна 600
//       $('.firstNav').removeClass('scrolled fixed-top'); // Удаляем правую колонку
//     }
//   });
////animated icon unit////
var AnimateInteractive = function($main) {

    this.svgContainer = $main.find("#interactive-skill");

    if (this.svgContainer.length === 0) {
        return;
    }

    this.finger = this.svgContainer.find('#finger');
    this.buttonbg = this.svgContainer.find('#button_bg');

    this.timeLine = new TimelineMax({
        yoyo: true,
        paused: true,
        onComplete: function() {
            //this.restart();
        }
    })
        .to(this.finger, 0.4, {
            x: -21,
            y: 20,
            delay: 0.7
        })
        .to({
            fake: 0
        }, 0.3, {
            fake: 30
        })
        .to(this.buttonbg, 0.01, {
            opacity: 1
        }, 1)
        .to(this.finger, 0.7, {
            x: 0,
            y: 0
        })
        .to(this.buttonbg, 0.2, {
            opacity: 0
        }, 1.3);


    this.svgContainer.off('runAnimation').on('runAnimation', function() {
        this.timeLine.play();
    }.bind(this));

    this.svgContainer.off('stopAnimation').on('stopAnimation', function() {
        this.timeLine.reverse();
    }.bind(this));

};


var AnimateHTML = function($main) {
    this.svgContainer = $main.find("#html5-skill");

    if (this.svgContainer.length === 0) {
        return;
    }
    this.star = this.svgContainer.find('#star');
    this.status = false;
    this.star.css('transform-origin', '56.5px 44.5px 0');

    var self = this;
    this.timeLine = new TimelineMax({
        yoyo: true,
        paused: true,
        onComplete: function() {
            //this.restart();
        },
        onReverseComplete: function() {
            //if(self.status) this.restart();
        }
    })
        .to(this.star, 0.50, {
            y: -19
        })
        .to(this.star, 0.14, {
            rotationY: 90,
            ease: Linear.easeNone
        }, 0.10)
        .to(this.star, 0.14, {
            rotationY: 0,
            ease: Linear.easeNone
        }, 0.24)
        .to(this.star, 0.14, {
            rotationY: 90,
            ease: Linear.easeNone
        }, 0.38)
        .to(this.star, 0.14, {
            rotationY: 0,
            ease: Linear.easeNone
        }, 0.52)

    .to(this.star, 0.14, {
        rotationY: 90,
        ease: Linear.easeNone
    }, 0.66)
        .to(this.star, 1.00, {
            y: 0,
            ease: Bounce.easeOut
        }, 0.80)

    .to(this.star, 0.14, {
        rotationY: 0,
        ease: Linear.easeNone
    }, 0.85);


    this.svgContainer.off('runAnimation').on('runAnimation', function() {
        this.timeLine.restart();
    }.bind(this));

};


var AnimateEvents = function($main) {
    this.svgContainer = $main.find("#event-skill");

    if (this.svgContainer.length === 0) {
        return;
    }
    this.flag = this.svgContainer.find('#flag');

    this.stick = this.svgContainer.find('#stick');
    this.stickPath = this.stick.find('path');

    this.flag.css({
        'transform-origin': '80px 0 0'
    });

    this.timeLine = new TimelineMax({
        yoyo: true,
        paused: true
    })
        .set(this.flag, {
            rotationY: 90
        })
        .set(this.stick, {
            y: 35
        })
        .set(this.stickPath, {
            'fill-opacity': 0
        })
        .to(this.stick, 0.7, {
            y: 0
        })
        .to(this.stickPath, 0.7, {
            'fill-opacity': 1
        }, 0)
        .to(this.flag, 2.5, {
            rotationY: 360
        })
        .to(this.flag, 2.5, {
            rotationY: 0
        });

    this.svgContainer.off('runAnimation').on('runAnimation', function() {
        this.timeLine.restart();
    }.bind(this));

};


var AnimateSDK = function($main) {
    this.svgContainer = $main.find("#sdk-skill");

    if (this.svgContainer.length === 0) {
        return;
    }

    this.bolt = this.svgContainer.find('#bolt');
    this.key = this.svgContainer.find('#key');

    this.bolt.css('transform-origin', '33px 82px 0');
    this.key.css('transform-origin', '43px 70px');

    this.timeLine = new TimelineMax({
        yoyo: true,
        paused: true,
        onComplete: function() {
            this.restart();
        }
    })
    .to(this.key, 0.7, {
        x: -11,
        y: 11
    })
    .to([this.key, this.bolt], 0.6, {
        rotation: 20,
        ease: RoughEase.ease.config({
            strength: 3.6,
            points: 4,
            template: Bounce.easeOut,
            randomize: false,
            taper: "out",
            clamp: true
        })
    })
    .to([this.key, this.bolt], 0.4, {
        rotation: 0
    })
    .to(this.key, 0.7, {
        x: 0,
        y: 0
    });

    this.svgContainer.off('runAnimation').on('runAnimation', function() {
        this.timeLine.play();
    }.bind(this));

    this.svgContainer.off('stopAnimation').on('stopAnimation', function() {
        this.timeLine.reverse();
    }.bind(this));
};


var AnimateSocial = function($main) {
    this.svgContainer = $main.find("#social-skill");

    if (this.svgContainer.length === 0) {
        return;
    }

    this.person_a = this.svgContainer.find('#person_a');
    this.person_b = this.svgContainer.find('#person_b');

    this.person_a.css('transform-origin', 'center bottom');
    this.person_b.css('transform-origin', 'center bottom');

    this.timeLine = new TimelineMax({
        yoyo: true,
        paused: true,
        onComplete: function() {
            this.restart();
        }
    })
    .to(this.person_a, 0.2, {
        y: -10
    })
    .to(this.person_a, 0.2, {
        y: 0
    })
    .to(this.person_a, 0.2, {
        y: -8
    })
    .to(this.person_a, 0.2, {
        y: 0
    })
    .to(this.person_b, 0.2, {
        y: -10
    })
    .to(this.person_b, 0.2, {
        y: 0
    })
    .to(this.person_b, 0.2, {
        y: -8
    })
    .to(this.person_b, 0.2, {
        y: 0
    });

    this.svgContainer.off('runAnimation').on('runAnimation', function() {
        this.timeLine.play();
    }.bind(this));

    this.svgContainer.off('stopAnimation').on('stopAnimation', function() {
        this.timeLine.reverse();
    }.bind(this));
};


var AnimateUX = function($main) {
    this.svgContainer = $main.find("#ux-skill");

    if (this.svgContainer.length === 0) {
        return;
    }

    this.blink = this.svgContainer.find('#blink');
    this.pupil = this.svgContainer.find('#pupil');

    this.pupil.css('transform-origin', '27px -40px');

    this.timeLine = new TimelineMax({
        yoyo: true,
        paused: true,
        onComplete: function() {
            this.restart();
        }
    })
    .to(this.blink, 0.001, {
        opacity: 1,
        delay: 0.2
    })
    .to(this.blink, 0.1, {
        opacity: 0,
        delay: 0.2
    })

    .to(this.pupil, 0.3, {
        x: 1,
        y: 0
    })
    .to(this.pupil, 0.3, {
        x: -1,
        y: 0
    })
    .to(this.pupil, 0.3, {
        x: 0,
        y: 0
    })
    .to(this.blink, 0.001, {
        opacity: 1,
        delay: 0.2
    })
    .to(this.blink, 0.001, {
        opacity: 0,
        delay: 0.2
    })
    .to(this.blink, 0.001, {
        opacity: 1,
        delay: 0.2
    })
    .to(this.blink, 0.001, {
        opacity: 0,
        delay: 0.2
    })
    .to(this.pupil, 0.3, {
        x: 0,
        y: 0
    });

    this.svgContainer.off('runAnimation').on('runAnimation', function() {
        this.timeLine.play();
    }.bind(this));

    this.svgContainer.off('stopAnimation').on('stopAnimation', function() {
        this.timeLine.reverse();
    }.bind(this));
};


var AnimateWeb = function($main) {
    this.svgContainer = $main.find("#web-skill");

    if (this.svgContainer.length === 0) {
        return;
    }

    this.mobile = this.svgContainer.find('#mobile');
    this.mobile2 = this.svgContainer.find('#mobile2');
    this.desktop = this.svgContainer.find('#desktop');


    this.timeLine = new TimelineMax({
        yoyo: true,
        paused: true,
        onComplete: function() {
            this.restart();
        }
    })
    .to(this.desktop, 0.5, {
        x: 13,
        delay: 1
    })
    .to([this.mobile, this.mobile2], 0.5, {
        x: -6,
        delay: 1
    }, 0)
    .to(this.mobile2, 0, {
        opacity: 1
    })
    .to([this.mobile, this.mobile2, this.desktop], 0.5, {
        x: 0
    })
    .to(this.desktop, 0.5, {
        x: 13,
        delay: 1
    })
    .to([this.mobile, this.mobile2], 0.5, {
        x: -6,
        delay: 1
    }, 2.0)
    .to(this.mobile2, 0, {
        opacity: 0
    })
    .to([this.mobile, this.mobile2, this.desktop], 0.5, {
        x: 0
    });

    this.svgContainer.off('runAnimation').on('runAnimation', function() {
        this.timeLine.play();
    }.bind(this));

    this.svgContainer.off('stopAnimation').on('stopAnimation', function() {
        this.timeLine.reverse();
    }.bind(this));
};

var AnimateBrand = function($main) {

    this.svgContainer = $main.find("#brand-skill");

    if (this.svgContainer.length === 0) {
        return;
    }

    this.pen = this.svgContainer.find('#pen');
    this.penHeight = 40;
    this.penWidth = 82;

    this.heart = this.svgContainer.find('#heart');

    this.heartPath = this.heart.find('#heartpath')[0];

    if (!this.heartPath) {
        return;
    }

    this.pathobj = {
        length: 0,
        pathLength: this.heartPath.getTotalLength()
    }

    this.pen.css('transform-origin', '23px 100px 0');

    this.timeLine = new TimelineMax({
        yoyo: true,
        paused: true
    })
    .to(this.pen, 0.4, {
        rotation: 45
    })
    .to(this.pathobj, 1, {
        length: this.pathobj.pathLength,
        ease: Linear.easeNone,
        onUpdateScope: this,
        onUpdate: function() {
            this.heartPath.style.strokeDasharray = [this.pathobj.length, this.pathobj.pathLength].join(' ');

            var coords = this.heartPath.getPointAtLength(this.pathobj.length);

            coords.y = coords.y - 102;
            coords.x = coords.x - 22;
            this.pen.css('transform', 'translate(' + coords.x + 'px, ' + coords.y + 'px) rotate(45deg)');

        }
    });

    this.svgContainer.off('runAnimation').on('runAnimation', function() {
        this.timeLine.play();
    }.bind(this));

    this.svgContainer.off('stopAnimation').on('stopAnimation', function() {
        this.timeLine.reverse();
    }.bind(this));
};

function setSkillAnimation($main) {
    new AnimateInteractive($main);
    new AnimateHTML($main);
    new AnimateEvents($main);
    new AnimateSDK($main);
    new AnimateSocial($main);
    new AnimateUX($main);
    new AnimateWeb($main);

    var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

    if(!is_firefox){
        //firefox 31 bug - https://bugzilla.mozilla.org/show_bug.cgi?id=1044355
        new AnimateBrand($main);
    }


    $main.find("#skills #li").on('mouseenter touchstart', function(e) {

            if(e.type == 'touchstart'){
                $("#skills #li").find('svg').trigger('stopAnimation');
            }

            $(this).find('svg').trigger('runAnimation');
     }).on('mouseleave', function() {
            $(this).find('svg').trigger('stopAnimation');
      });

}

setSkillAnimation($('body'));
///скролинг
  $(document).ready(function(){
  $('.go_to').click( function(){ // ловим клик по ссылке с классом go_to
var scroll_el = $(this).attr('href');
var width = $(window).width(); // возьмем содержимое атрибута href, должен быть селектором, т.е. например начинаться с # или .
      if ($(scroll_el).length != 0 && width > 992 ) { // проверим существование элемента чтобы избежать ошибки
    $('html, body').animate({ scrollTop: $(scroll_el).offset().top-50  }, 500); // анимируем скроолинг к элементу scroll_el
      }
    return false; // выключаем стандартное действие
  });
});
$(document).ready(function(){
$('.go_to').click( function(){ // ловим клик по ссылке с классом go_to
var scroll_el = $(this).attr('href');
var width = $(window).width(); // возьмем содержимое атрибута href, должен быть селектором, т.е. например начинаться с # или .
    if ($(scroll_el).length != 0 && width < 992 > 768) { // проверим существование элемента чтобы избежать ошибки
  $('html, body').animate({ scrollTop: $(scroll_el).offset().top-50  }, 500); // анимируем скроолинг к элементу scroll_el
    }
  return false; // выключаем стандартное действие
});
});
// $(document).ready(function(){
// $('.go_to').click( function(){ // ловим клик по ссылке с классом go_to
// var scroll_el = $(this).attr('href');
// var width = $(window).width(); // возьмем содержимое атрибута href, должен быть селектором, т.е. например начинаться с # или .
//     if ($(scroll_el).length != 0 && width < 500 ) { // проверим существование элемента чтобы избежать ошибки
//   $('html, body').animate({ scrollTop: $(scroll_el).offset().top 0  }, 500); // анимируем скроолинг к элементу scroll_el
//     }
//   return false; // выключаем стандартное действие
// });
// });
$(document).ready(function(){
$('.go_to').click( function(){ // ловим клик по ссылке с классом go_to
var scroll_el = $(this).attr('href');
var width = $(window).width(); // возьмем содержимое атрибута href, должен быть селектором, т.е. например начинаться с # или .
    if ($(scroll_el).length != 0 && width < 768 ) { // проверим существование элемента чтобы избежать ошибки
  $('html, body').animate({ scrollTop: $(scroll_el).offset().top-10  }, 500); // анимируем скроолинг к элементу scroll_el
    }
  return false; // выключаем стандартное действие
});
});
///navigationMobile
$(document).ready(function(){
  $('.hamburger').click(function() {
    $('.hamburger').toggleClass('listActive');
    $('.list').toggleClass('listActive');
  });
});
//Модальное окно

//открыть по кнопке
$('.js-button-campaign').click(function() {

	$('.js-overlay-campaign').fadeIn();
	$('.js-overlay-campaign').addClass('disabled');
});

// закрыть на крестик
$('.js-close-campaign').click(function() {
	$('.js-overlay-campaign').fadeOut();

});

// закрыть по клику вне окна
$(document).mouseup(function (e) {
	var popup = $('.js-popup-campaign');
	if (e.target!=popup[0]&&popup.has(e.target).length === 0){
		$('.js-overlay-campaign').fadeOut();

	}
});
