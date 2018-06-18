#!/usr/bin/env node
const trae = require('trae')
const ora = require('ora')
const moment = require('moment')

const argv = process.argv.slice(2)

const config = { debug: argv.includes('--debug') }

main(config)

// -------------------------------------

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

function isAfter(match, date) {
  return moment(match.datetime).isAfter(moment(date))
}

function isAfterToday(match) {
  return isAfter(match, moment())
}

const printMatch = widths => match => {
  const { country: hTeam, goals: hGoals } = match.home_team
  const home = `${hGoals} ${hTeam.padEnd(widths.home, ' ')}`

  const { country: aTeam, goals: aGoals } = match.away_team
  const away = `${aTeam.padStart(widths.home, ' ')} ${aGoals}`

  console.log(`${home} VS ${away}`)
}

const matchTime = widths => match => {
  const { datetime } = match
  const hour = moment(datetime).format('HH:mm')

  const { country: hTeam } = match.home_team
  const home = `${hTeam.padEnd(widths.home, ' ')}`

  const { country: aTeam } = match.away_team

  return `${hour} ${home} VS ${aTeam}`
}

const printMatchTime = widths => match => {
  console.log(matchTime(widths)(match))
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

function matchesWithTime(matches, date) {
  const nextMatches = matches
    .filter(match => isAfter(match, date))
    .sort((m1, m2) => new Date(m1.datetime) - new Date(m2.datetime))
    .filter((match, _, [nextMatch]) => matchSameDay(match, nextMatch))

  const nextMatch = nextMatches[0]

  const widths = calculateWidths(nextMatches)

  let output = nextMatches.length
    ? `Next Matches ${friendlyDateStr(nextMatch)}:`
    : ''

  output = nextMatches.reduce(
    (out, match) => `${out}\n${matchTime(widths)(match)}`,
    output,
  )

  return output
}

function friendlyDateStr(match) {
  return isToday(match)
    ? 'today'
    : isTomorrow(match)
      ? 'tomorrow'
      : moment(match.datetime).format('MMM DD')
}

async function main({ debug }) {
  const spinner = ora({
    text: 'Loading matches...',
    spinner: {
      interval: 160,
      frames: ['⚽   ', ' ⚽  ', '  ⚽ ', '   ⚽'],
    },
    color: 'white'
  })

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

    finishedMatches.length && inProgressMatches.length && console.log('')

    if (inProgressMatches.length) {
      console.log('IN PRO'.padStart(widths.home + 5, ' ') + 'GRESS')
      inProgressMatches.forEach(printMatch(widths))
    }

    // TODO: if no matches today and/or tomorrow find next day
    const todayMatchesOutput = matchesWithTime(matches, moment())
    const tomorrowMatchesOutput = matchesWithTime(
      matches,
      moment().add(1, 'day'),
    )

    ;(todayMatchesOutput ||
      tomorrowMatchesOutput ||
      finishedMatches.length ||
      inProgressMatches.length) &&
      console.log()

    todayMatchesOutput && console.log(todayMatchesOutput)
    todayMatchesOutput && tomorrowMatchesOutput && console.log()
    tomorrowMatchesOutput && console.log(tomorrowMatchesOutput)
  } catch (e) {
    spinner.fail('Ups! Something went wrong.')
    debug && console.log(e)
  }
}
