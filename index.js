#!/usr/bin/env node
const trae = require('trae')
const ora = require('ora')
const moment = require('moment')

function sameDay(m1, m2) {
  return m1.isSame(m2, 'day')
}

function matchSameDay(match1, match2) {
  return sameDay(moment(match1.datetime), moment(match2.datetime))
}

function isToday(match) {
  const today = moment()
  const matchDate = moment(match.datetime)

  return sameDay(today, matchDate)
}

function isTomorrow(match) {
  const tomorrow = moment().add(1, 'days')
  const matchDate = moment(match.datetime)

  return sameDay(tomorrow, matchDate)
}

function afterToday(match) {
  const today = moment()
  const matchDate = moment(match.datetime)

  return (
    matchDate.year() == today.year() &&
    matchDate.dayOfYear() > today.dayOfYear()
  )
}

const printMatch = widths => match => {
  const { country: hTeam, goals: hGoals } = match.home_team
  const home = `${hGoals} ${hTeam.padEnd(widths.home, ' ')}`

  const { country: aTeam, goals: aGoals } = match.away_team
  const away = `${aTeam.padStart(widths.away, ' ')} ${aGoals}`

  console.log(`${home} VS ${away}`)
}

const printMatchTime = widths => match => {
  const { datetime } = match
  const hour = moment(datetime).format('HH:mm')

  const { country: hTeam } = match.home_team
  const home = `${hTeam.padEnd(widths.home, ' ')}`

  const { country: aTeam } = match.away_team

  console.log(`${hour} ${home} VS ${aTeam}`)
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

    if (!inProgressMatches.length) {
      const matchesAfterToday = matches
        .filter(afterToday)
        .sort((m1, m2) => new Date(m1.datetime) - new Date(m2.datetime))

      const nextMatch = matchesAfterToday[0]

      const nextMatches = matchesAfterToday.filter(match =>
        matchSameDay(match, nextMatch),
      )

      const widths = calculateWidths(nextMatches)

      const date = moment(nextMatch.datetime)
      const dateStr = isTomorrow(nextMatch) ? 'Tomorrow' : date.format('MMM DD')

      console.log('')
      console.log(`Next Matches (${dateStr}):`)

      nextMatches.forEach(printMatchTime(widths))
    }

    if (!finishedMatches.length && !inProgressMatches.length) {
      console.log('No matches today')
    }
  } catch (e) {
    spinner.fail('Ups! Something went wrong.')
  }
}

main()
