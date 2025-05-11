module.exports = app => {

    app.get('/', (req, res) => {
        console.log('Rendering index page');
        res.render('index');
    });

    app.get('/white', (req, res) => {
        console.log('Rendering white player page');
        res.render('game', {
            color: 'white'
        });
    });

    app.get('/black', (req, res) => {
        console.log('Attempting to join game with code:', req.query.code);
        if (!games[req.query.code]) {
            console.log('Invalid game code:', req.query.code);
            return res.redirect('/?error=invalidCode');
        }

        console.log('Rendering black player page');
        res.render('game', {
            color: 'black'
        });
    });

    app.get('/spectate', (req, res) => {
        console.log('Attempting to spectate game with code:', req.query.code);
        if (!games[req.query.code]) {
            console.log('Invalid game code for spectate:', req.query.code);
            return res.redirect('/?error=invalidCode');
        }

        console.log('Rendering spectator page');
        res.render('spectate', (err, html) => {
            if (err) {
                console.error('Error rendering spectate view:', err);
                return res.status(500).send('Error rendering spectator view');
            }
            res.send(html);
        });
    });
}; 