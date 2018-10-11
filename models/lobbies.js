module.exports = (pool) => {

	return {

		getId: (query, callback) => {

			const queryString = `SELECT * FROM lobbies WHERE id = ${query.id};`;

			pool.query(queryString, (error, queryResult) => {
				callback(error, queryResult);
			})
		}, 

		index: (callback) => {

			const queryString = 'SELECT lobbies.id, lobbies.name, users.name AS host_name, lobbies.name AS lobby_name, lobbies.player_count FROM lobbies INNER JOIN users ON (users.id = lobbies.host_id) WHERE lobbies.player_count < 5 ORDER BY id ASC;';

			pool.query(queryString, (error, queryResult) => {
				callback(error, queryResult);
			})
		},

		create: (query, callback) => {

			const queryString = 'INSERT INTO lobbies (name, host_id, round, player_count) VALUES ($1, $2, $3, $4) RETURNING *';
			const values = [query.name, query.host_id, 0, 1];

			pool.query(queryString, values, (error, queryResult) => {
				callback(error, queryResult);
			})
		},

		join: (query, callback) => {

			const queryString = 'INSERT INTO players_in_lobby (lobby_id, user_id, player_number) VALUES ($1, $2, $3);';
			const values = [query.lobby_id, query.user_id, query.player_number];

			pool.query(queryString, values, (error, queryResult) => {
				callback(error, queryResult);
			})
		},

		getPlayers: (query, callback) => {

			const queryString = 'SELECT players_in_lobby.player_number, players_in_lobby.role, players_in_lobby.user_id, users.name FROM players_in_lobby INNER JOIN users ON (users.id = players_in_lobby.user_id) WHERE lobby_id = $1 ORDER by players_in_lobby.id ASC;';
			const values = [query.id];

			pool.query(queryString, values, (error, queryResult) => {
				callback(error, queryResult);
			})
		},

	}
}