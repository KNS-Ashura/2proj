module.exports = function (io, pool) {
    io.on('connection', (socket) => {
        console.log('Un joueur connecté :', socket.id);
    });
};