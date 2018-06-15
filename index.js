#!/usr/bin/env node
const trae = require('trae')
const ora = require('ora')

function isToday(match) {
  const today = new Date()
  const matchDate = new Date(match.datetime)

  return matchDate.getYear() == today.getYear() &&
    matchDate.getMonth() == today.getMonth() &&
    matchDate.getDate() == today.getDate()
}

function printMatch(match) {
  const homeTeam = match.home_team.country
  const homeGoals = match.home_team.goals
  const awayTeam = match.away_team.country
  const awayGoals = match.away_team.goals

  console.log(`${homeGoals} ${homeTeam} VS ${awayTeam} ${awayGoals}`)
}

async function main() {
  const spinner = ora('Loading matches')

  spinner.start()

  try {

    const { data: matches } = await trae.get('http://worldcup.sfg.io/matches')

    const todayMatches = matches.filter(isToday)

    const finishedMatches = todayMatches.filter(match => match.status === 'completed')
    const inProgressMatches = todayMatches.filter(match => match.status === 'in progress')

    spinner.stop()

    if (finishedMatches.length) {
      console.log('FINISHED')
      console.log('========')
      finishedMatches.forEach(printMatch)
    }
    if (finishedMatches.length && inProgressMatches.length) {
      console.log('')
    }
    if (inProgressMatches.length) {
      console.log('IN PROGRESS')
      console.log('===========')
      inProgressMatches.forEach(printMatch)
    }

    if (!finishedMatches.length && !inProgressMatches.length) {
      console.log('No matches today')
    }
  } catch(e) {
    spinner.fail('Ups! Something went wrong.')
  }
}

main()
