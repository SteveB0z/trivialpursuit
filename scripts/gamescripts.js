var gamescripts = (function () {

    var item = null;
    var wid = 6;
    var timerInterval = null;
    var timeLeft = 60;

    return {
        init: function () {
            // install listeners for game pieces
            $('.gamepiece').each(function () {
                this.addEventListener('dragstart', gamescripts.drag_start, false);
            });

            // install listeners for master wedges
            $('.wedge').each(function () {
                this.addEventListener('dragstart', gamescripts.drag_start, false);
            });

            // install listeners on board
            document.body.addEventListener('dragover', gamescripts.drag_over, false);
            document.body.addEventListener('drop', gamescripts.drop, false);

            // install listeners for team names and categories
            $('.team-name-input, .category-input').on('input', function () {
                gamescripts.saveState();
            });

            // load saved state
            gamescripts.loadState();
        },

        saveState: function () {
            var gameState = {
                pieces: {},
                wedges: {},
                teamNames: {},
                categories: {},
                widCounter: wid
            };

            // save game pieces positions
            $('.gamepiece').each(function () {
                gameState.pieces[this.id] = {
                    left: this.style.left,
                    top: this.style.top
                };
            });

            // save team wedges
            for (var i = 0; i < 6; i++) {
                var teamWedges = [];
                $('#t' + i + ' .wedge').each(function () {
                    teamWedges.push({
                        id: this.id,
                        colorClass: this.className.match(/wedge\d/)[0]
                    });
                });
                gameState.wedges['t' + i] = teamWedges;
            }

            // save team names
            $('.team-name-input').each(function () {
                gameState.teamNames[this.id] = $(this).val();
            });

            // save categories
            $('.category-input').each(function () {
                gameState.categories[this.id] = $(this).val();
            });

            localStorage.setItem('trivialPursuitState', JSON.stringify(gameState));
        },

        loadState: function () {
            var savedState = localStorage.getItem('trivialPursuitState');
            if (!savedState) return;

            var gameState = JSON.parse(savedState);

            // restore game pieces positions
            if (gameState.pieces) {
                $.each(gameState.pieces, function (id, position) {
                    var piece = document.getElementById(id);
                    if (piece && position.left && position.top) {
                        piece.style.left = position.left;
                        piece.style.top = position.top;
                    }
                });
            }

            // restore team wedges
            if (gameState.wedges) {
                $.each(gameState.wedges, function (teamId, wedges) {
                    $('#' + teamId).empty();
                    $.each(wedges, function (index, wedge) {
                        $('#' + teamId).append('<span id="' + wedge.id + '" class="wedge ' + wedge.colorClass + '" draggable="true" data-draggable="slave-wedge">&#9660;</span>');
                        document.getElementById(wedge.id).addEventListener('dragstart', gamescripts.drag_start, false);
                    });
                });
            }

            // restore wid counter
            if (gameState.widCounter) {
                wid = gameState.widCounter;
            }

            // restore team names
            if (gameState.teamNames) {
                $.each(gameState.teamNames, function (id, name) {
                    $('#' + id).val(name);
                });
            }

            // restore categories
            if (gameState.categories) {
                $.each(gameState.categories, function (id, category) {
                    $('#' + id).val(category);
                });
            }
        },

        clearState: function () {
            localStorage.removeItem('trivialPursuitState');
        },

        resetGame: function () {
            if (confirm('Sei sicuro di voler resettare il gioco? Tutte le posizioni e i punteggi verranno cancellati.')) {
                // clear localStorage
                gamescripts.clearState();

                // reset game pieces positions
                $('.gamepiece').each(function () {
                    this.style.left = '';
                    this.style.top = '';
                });

                // clear all team wedges
                for (var i = 0; i < 6; i++) {
                    $('#t' + i).empty();
                }

                // clear category inputs
                $('.category-input').val('');

                // clear team name inputs
                $('.team-name-input').val('');

                // reset wid counter
                wid = 6;

                alert('Gioco resettato!');
            }
        },

        drag_start: function (event) {
            item = event.target;
            var style = window.getComputedStyle(event.target, null);
            event.dataTransfer.setData("text/plain", (parseInt(style.getPropertyValue("left"), 10) - event.clientX) + ',' + (parseInt(style.getPropertyValue("top"), 10) - event.clientY));
        },

        drag_over: function (event) {
            if (!item) return;
            event.preventDefault();
            return false;
        },

        drop: function (event) {
            if (!item) return;

            // allow game pieces to be dropped anywhere on the board
            if (item.getAttribute('data-draggable') == 'gamepiece' && event.target.id == 'board') {
                var offset = event.dataTransfer.getData("text/plain").split(',');
                dm = document.getElementById(item.id);
                item.style.left = (event.clientX + parseInt(offset[0], 10)) + 'px';
                item.style.top = (event.clientY + parseInt(offset[1], 10)) + 'px';
                gamescripts.saveState();
            }

            // allow master wedges to be dropped into team score boxes
            if (item.getAttribute('data-draggable') == 'master-wedge' && $('#' + event.target.id).parents('table:first').attr('id') == 'score-table') {
                gamescripts.master_wedge_helper(event);
                gamescripts.saveState();
            }

            // allow slave wedges to be deleted from team score boxes
            if (item.getAttribute('data-draggable') == 'slave-wedge' && $('#' + event.target.id).parents('table:first').attr('id') != 'score-table') {
                gamescripts.slave_wedge_helper(event);
                gamescripts.saveState();
            }

            item = null;
            event.preventDefault();
            return false;
        },

        master_wedge_helper: function (event) {
            var colorid = item.id[1];
            var team = event.target.id;

            if (!team || team == undefined) return;

            // add wedge to table and give it a listener for dragstart
            $('#' + team).append('<span id="w' + wid + '" class="wedge wedge' + colorid + '" draggable="true" data-draggable="slave-wedge">&#9660;</span>');
            document.getElementById('w' + wid).addEventListener('dragstart', gamescripts.drag_start, false);

            // increment wedge id
            wid += 1;
        },

        slave_wedge_helper: function (event) {
            $('#' + item.id).remove();
        },

        startTimer: function () {
            if (timerInterval !== null) {
                return; // Timer già in esecuzione
            }

            $('#timer-start-btn').prop('disabled', true);

            timerInterval = setInterval(function () {
                timeLeft--;
                $('#timer-display').text(timeLeft);

                if (timeLeft <= 10) {
                    $('#timer-display').css('color', '#FF4848');
                }

                if (timeLeft <= 0) {
                    gamescripts.stopTimer();
                }
            }, 1000);
        },

        stopTimer: function () {
            if (timerInterval !== null) {
                clearInterval(timerInterval);
                timerInterval = null;
                $('#timer-start-btn').prop('disabled', false);
            }
        },

        resetTimer: function () {
            gamescripts.stopTimer();
            timeLeft = 60;
            $('#timer-display').text(timeLeft).css('color', '#000000');
        }
    }

}());

$(function () { gamescripts.init() });