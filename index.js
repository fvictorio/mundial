#!/usr/bin/env node
const trae = require('trae')
const ora = require('ora')

function isToday(match) {
  const today = new Date()
  const matchDate = new Date(match.datetime)

  return (
    matchDate.getYear() == today.getYear() &&
    matchDate.getMonth() == today.getMonth() &&
    matchDate.getDate() == today.getDate()
  )
}

const printMatch = widths => match => {
  const { country: hTeam, goals: hGoals } = match.home_team
  const home = `${hGoals} ${hTeam.padEnd(widths.home, ' ')}`

  const { country: aTeam, goals: aGoals } = match.away_team
  const away = `${aTeam.padStart(widths.home, ' ')} ${aGoals}`

  console.log(`${home} VS ${away}`)
}

const calculateWidths = matches =>
  matches.reduce(
    (acc, match) => {
      if (acc.home < match.home_team.country.length) {
        acc.home = match.home_team.country.length
      }
      if (acc.away < match.away_team.country.length) {
        acc.away = match.away_team.country.length
      }

      return acc
    },
    { home: 0, away: 0 },
  )

async function main() {
  const spinner = ora('Loading matches')

  spinner.start()

  try {
    const { data: matches } = await trae.get('http://worldcup.sfg.io/matches')

    const todayMatches = matches.filter(isToday)

    const finishedMatches = todayMatches.filter(
      match => match.status === 'completed',
    )
    const inProgressMatches = todayMatches.filter(
      match => match.status === 'in progress',
    )

    const widths = calculateWidths(todayMatches)

    spinner.stop()

    if (finishedMatches.length) {
      console.log('FINI'.padStart(widths.home + 4, ' ') + 'SHED')
      finishedMatches.forEach(printMatch(widths))
    }
    if (finishedMatches.length && inProgressMatches.length) {
      console.log('')
    }
    if (inProgressMatches.length) {
      console.log('IN PRO'.padStart(widths.home + 5, ' ') + 'GRESS')
      inProgressMatches.forEach(printMatch(widths))
    }

    if (!finishedMatches.length && !inProgressMatches.length) {
      console.log('No matches today')
    }
  } catch (e) {
    spinner.fail('Ups! Something went wrong.')
  }
}

main()
