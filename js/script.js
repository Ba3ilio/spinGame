(function(win, doc, body) {
    
    function try_callback(callback, err) {
        var response = arguments[2];

        try {
            setTimeout(function() {
                callback(err, response);
            }, 0);
        } catch (e) {}
    }

    function preload_images(base_path, images, callback) {
        if (images.length === 0) {
            try_callback(callback, 'no images found');
            return;
            console.log(images.length);
        }

        var count = 0,
            image_objs = [];

        function imageHolder(e) {
            if (e.type === 'error') {
                try_callback(callback, e);
            } else if (++count === images.length) {
                try_callback(callback, null, image_objs);
            }
        }

        images.forEach(function(v) {
            var img = new Image();

            img.addEventListener('error', imageHolder);
            img.addEventListener('load', imageHolder);
            image_objs.push(img);

            img.setAttribute('data-name', v);

            img.src = base_path + v;
        });
    }

    function request_json(url, callback) {
        var xhq = new XMLHttpRequest();

        xhq.addEventListener('load', function() {
            try {
                try_callback(callback, null, JSON.parse(xhq.responseText));
            } catch (e) {
                try_callback(callback, 'invalid');
            }
        }, false);

        xhq.addEventListener('error', function() {
            try_callback(callback, 'error')
        }, false);

        xhq.addEventListener('abort', function() {
            try_callback(callback, 'abort')
        }, false);

        xhq.open('get', url, true);
        xhq.send();
    }

    function when_dom_ready(callback) {
        if (document.readyState === 'complete' ||
            document.readyState === 'interactive') {
            try_callback(callback, null);
        } else {
            document.addEventListener("DOMContentLoaded", function() {
                try_callback(callback, null);
            });
        }
    }


    function slotMachine(names, images) {
            var spinner = doc.getElementById('spinner'),
                selector = doc.getElementById('selector'),
                statuses = doc.getElementById('statuses'),
                spin_button = doc.getElementById('spin-button');

            images.forEach(function(v, i) {
                spinner.appendChild(v);

                var option = doc.createElement('option');
                option.text = names[i];
                option.value = v.getAttribute('data-name');

                selector.add(option);
            });

  
            images[0].classList.add('shown');

            var delay_timeout = null;

            function check_result(image) {
                var result = image.getAttribute('data-name') ===
                    selector.value;

                set_state(result ? 'win' : 'fail');
                
            }

            function set_status(status) {
                statuses.querySelector('div.shown')
                    .classList.remove('shown');
                var new_status = statuses.querySelector('#status-' +
                    status);

                new_status.classList.add('shown');

                if (status == 'win' || status == 'fail') {
                    new_status.classList.remove('animated');
                    new_status.offsetWidth = new_status.offsetWidth;
                    new_status.classList.add('animated');
                }
            }

            function set_state(state) {
                set_status(state);

                switch (state) {
                    case 'choose':
                    case 'win':
                    case 'fail':
                        selector.disabled = false;
                        spin_button.disabled = false;
                        break;
                    case 'spin':
                        clearTimeout(delay_timeout);
                        selector.disabled = true;
                        spin_button.disabled = true;
                        break;
                }
            }

            spin_button.addEventListener('click', function() {
                set_state('spin');

                var current_visible = spinner.querySelector(
                        'img.shown'),
                    time = 1000 * (Math.random() * 4 + 2), // in ms
                    spent = 0,
                    round_time = 100;

                // spinning fruit images
                setTimeout(function spin_round() {
                    current_visible.classList.remove(
                        'shown');
                    current_visible = current_visible.nextSibling ||
                        spinner.firstChild;
                    current_visible.classList.add('shown');

                    spent += round_time;

                    if (spent > time) {
                        check_result(current_visible);
                        return;
                    }

                    setTimeout(spin_round, round_time += 50);
                }, round_time);
            });

            spin_button.disabled = false;
        }


    request_json('data.json', function(error, images_hash) {
        if (error) {
            return;
        }

        var names = Object.keys(images_hash),
            values = names.map(function(k) {
                return images_hash[k];
            });

        preload_images('images/', values, function(err, images) {
            if (error) {
                return;
            }

            when_dom_ready(function() {
                slotMachine(names, images);
            });
        });
    });
})(window, document, document.body);