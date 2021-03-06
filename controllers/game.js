module.exports = (db, io) => {

	updateGame = (request) => {

		db.lobbies.getId(request, (error, queryResult) => {
			if (error) {
				console.error('Error getting players in lobby:', error);
				response.sendStatus(500);

			} else {

				let lobby = queryResult.rows[0];

				db.lobbies.getPlayers(lobby, (error, queryResult) => {
					if (error) {
						console.error('Error getting players in lobby:', error);
						response.sendStatus(500);

					} else {

						players = queryResult.rows;

						db.game.getMission(lobby, (error, queryResult) => {
							if (error) {
								console.error('Error getting players in lobby:', error);
								response.sendStatus(500);

							} else {

								mission = queryResult.rows[0];

								db.game.getVotes(lobby, (error, queryResult) => {
									if (error) {
										console.error('Error getting players in lobby:', error);
										response.sendStatus(500);

									} else {

										votes = queryResult.rows;

										db.game.getOutcomes(lobby, (error, queryResult) => {
											if (error) {
												console.error('Error getting players in lobby:', error);
												response.sendStatus(500);

											} else {

												outcomes = queryResult.rows;

												db.game.getAllMissions(lobby, (error, queryResult) => {
													if (error) {
														console.error('Error getting players in lobby:', error);
														response.sendStatus(500);
	
													} else {
	
														allMissions = queryResult.rows;

														db.game.getAllVotes(lobby, (error, queryResult) => {
															if (error) {
																console.error('Error getting players in lobby:', error);
																response.sendStatus(500);
			
															} else {
			
																allVotes = queryResult.rows;
			
																io.emit('updateGame', lobby, players, mission, votes, outcomes, allMissions, allVotes);
															}
														})
													}
												})
											}
										})
									}
								})
							}
						})
					}
				})
			}
		})
	}

	return {
		
		updateGame,

		choosePhase: (request, response) => {

			if (request.body.choiceOne === request.body.choiceTwo || request.body.choiceOne === request.body.choiceThree || request.body.choiceTwo === request.body.choiceThree) {
				
				response.redirect('/lobbies/' + request.params.id);
	
			} else {

				let queryString = {
					id: request.params.id,
					leader: request.body.leader,
					mission: request.body.mission_number,
					choice_one: request.body.choiceOne,
					choice_two: request.body.choiceTwo,
					choice_three: request.body.choiceThree
				}

				db.game.getMission(queryString, (error, queryResult) => {
					if (error) {
						console.error('Error getting mission.', error);
						response.sendStatus(500);
		
						// creates mission if it doesn't exist
					} else if (queryResult.rowCount === 0) {
						
						db.game.createMission(queryString, (error, queryResult) => {
							if (error) {
								console.error('Error creating mission.', error);
								response.sendStatus(500);
							} else {
		
								db.game.votingPhase(request.params, (error, queryResult) => {
									if (error) {
										console.error('Error going to voting phase.', error);
										response.sendStatus(500);
									} else {

										updateGame(request.params);
				
										response.redirect("/lobbies/" + request.params.id);
									}
								})
							}
						})
					} else {

						// updates mission if it exists
						db.game.updateMission(queryString, (error, queryResult) => {
							if (error) {
								console.error('Error updating mission.', error);
								response.sendStatus(500);
							} else {

								db.game.votingPhase(request.params, (error, queryResult) => {
									if (error) {
										console.error('Error going to voting phase.', error);
										response.sendStatus(500);
									} else {
		
										updateGame(request.params);
				
										response.redirect("/lobbies/" + request.params.id);
									}
								})
							}
						})
					}
				})
			}
		},

		startGame: (request, response) => {

			db.game.assignRoles(request.params, (error, queryResult) => {
				if (error) {
					console.error('Error assigning roles.', error);
					response.sendStatus(500);
				} else {

					db.game.startGame(request.params, (error, queryResult) => {
						if (error) {
							console.error('Error starting game.', error);
							response.sendStatus(500);
						} else {

							io.emit('updateGame', request.params);

							response.redirect("/lobbies/" + request.params.id);
						}
					})
				}
			})	
		},

		getMission: (request, response) => {

			db.game.getMission(request.params, (error, queryResult) => {
				if (error) {
					console.error('Error getting mission.', error);
					response.sendStatus(500);
				} else {

					response.send(queryResult.rows[0]);
				}
			})
		},

		getVotes: (request, response) => {

			db.game.getVotes(request.params, (error, queryResult) => {
				if (error) {
					console.error('Error getting votes.', error);
					response.sendStatus(500);
				} else {

					response.send(queryResult.rows);
				}
			})
		},

		vote: (request, response) => {

			let queryString = {
				id: request.params.id,
				mission: request.params.mission,
				player_number: request.body.player_number,
				vote: request.body.vote
			}

			db.game.vote(queryString, (error, queryResult) => {
				if (error) {
					console.error('Error getting votes.', error);
					response.sendStatus(500);
				} else {

					db.game.getVotes(request.params, (error, queryResult) => {
						if (error) {
							console.error('Error getting votes.', error);
							response.sendStatus(500);
						} else {
												
							if (queryResult.rowCount === 5) {
	
								let votesYes = 0;
	
								for (let i in queryResult.rows) {
									if (queryResult.rows[i].vote) {
										votesYes++;
									}
								}
								if (votesYes >= 3) {

									// VOTE PASSED
									db.game.missionPhase(request.params, (error, queryResult) => {
										if (error) {
											console.error('Error going to mission phase.', error);
										} else {

											io.emit('updateGame', request.params);
					
											response.redirect("/lobbies/" + request.params.id);
										}
									})

								} else {
	
									db.game.choosePhase(request.params, (error, queryResult) => {
										if (error) {
											console.error('Error going back to choose phase.', error);
											response.sendStatus(500);
										} else {

											let current_player = queryResult.rows[0].current_player + 1;

											if (current_player === 6) {
												current_player = 1;
											}

											let queryString = {
												id: request.params.id,
												current_player: current_player
											}

											db.game.updateCurrentPlayer(queryString, (error, queryResult) => {
												if (error) {
													console.error('Error updating current player.', error);
													response.sendStatus(500);
												} else {

													db.game.resetVotes(request.params, (error, queryResult) => {
														if (error) {
															console.error('Error reseting votes.', error);
															response.sendStatus(500);
														} else {
														
															io.emit('updateGame', request.params);
					
															response.redirect("/lobbies/" + request.params.id);
														}
													})
												}
											})
										}
									})
								}
							} else { // less than 5 votes
	
								io.emit('updateGame', request.params);
			
								response.redirect("/lobbies/" + request.params.id);
							}
						}
					})
				}
			})
		},

		mission: (request, response) => {

			let queryString = {
				id: request.params.id,
				mission: request.params.mission,
				player_number: request.body.player_number,
				vote: request.body.vote
			}

			db.game.goOnMission(queryString, (error, queryResult) => {
				if (error) {
					console.error ('Error on mission.');
					response.sendStatus(500);
				
				} else {

					db.game.getOutcomes(request.params, (error, queryResult) => {
						if (error) {
							console.error ('Error on mission.');
							response.sendStatus(500);

						} else {

							if (
								(queryResult.rowCount === 2 && (queryString.mission ==  1 || queryString.mission == 3)) || (queryResult.rowCount === 3 && (queryString.mission == 2 || queryString.mission == 4 || queryString.mission == 5))
								) {

									let failVotes = 0;

									for (let i in queryResult.rows) {
										if (queryResult.rows[i].vote == false) {
											failVotes++;
										}
									}

									let queryString = {
										id: request.params.id,
										mission: request.params.mission,
										fail_votes: failVotes
									}

									if (failVotes > 0) {
										queryString['success'] = false;
									} else {
										queryString['success'] = true;
									}

									db.game.givePoints(queryString, (error, queryResult) => {
										if (error) {
											console.error('Error giving points.', error);
											response.sendStatus(500);
										} else {

											db.game.checkWin(request.params, (error, queryResult) => {
												if (error) {
													console.error('Error checking win.', error);
													response.sendStatus(500);
												} else {

													let resistancePts = 0;
													let spiesPts = 0;

													for (let i in queryResult.rows) {
														if (queryResult.rows[i].success) {
															resistancePts ++;
														} else {
															spiesPts ++;
														}
													}

													if (resistancePts >= 3 || spiesPts >= 3) {

														db.game.over(request.params, (error, queryResult) => {
															if (error) {
																console.error('Error ending game.');
																response.sendStatus(500);
															} else {

																updateGame(request.params);
																response.redirect("/lobbies/" + request.params.id);
															}
														})
													
													} else {

														let newMission = request.params.mission - -1; // fuck javascript
														let newPlayer = request.body.current_player - -1;

														if (newPlayer === 6) {
															newPlayer = 1;
														}

														let queryString = {
															id: request.params.id,
															mission: newMission,
															current_player: newPlayer
														}
			
														db.game.nextMission(queryString, (error, queryResult) => {
															if (error) {
																console.error('Error going to next mission.', error);
																response.sendStatus(500);
															} else {

																updateGame(request.params);
																response.redirect("/lobbies/" + request.params.id);
															}
														})
													}
												}
											})

										}

									})

							} else {

								response.redirect("/lobbies/" + request.params.id);
							}
						} 
					})
				}
			})
		},

		getOutcomes: (request, response) => {

			db.game.getOutcomes(request.params, (error, queryResult) => {
				if (error) {
					console.error('Error getting votes.', error);
					response.sendStatus(500);
				} else {

					response.send(queryResult.rows);
				}
			})
		},
		
		getPoints: (request, response) => {

			db.game.checkWin(request.params, (error, queryResult) => {
				if (error) {
					console.error('Error getting votes.', error);
					response.sendStatus(500);
				} else {

					response.send(queryResult.rows);
				}
			})
		}, 








	}
}

