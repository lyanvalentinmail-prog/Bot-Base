/**
 * Calculadora segura: analizador propio (sin eval) con
 * + - * / % ^, parentesis y funciones basicas.
 */
import { UserError } from '../../lib/errors.js'

const FUNCTIONS = {
  sqrt: Math.sqrt, abs: Math.abs, sin: Math.sin, cos: Math.cos, tan: Math.tan,
  log: Math.log10, ln: Math.log, round: Math.round, floor: Math.floor, ceil: Math.ceil
}
const CONSTANTS = { pi: Math.PI, e: Math.E }

function tokenize (input) {
  const tokens = []
  const regex = /\s*([A-Za-z]+|\d+\.?\d*|\.\d+|[()+\-*/%^,])/y
  let index = 0
  while (index < input.length) {
    regex.lastIndex = index
    const match = regex.exec(input)
    if (!match) throw new UserError(`❌ Carácter no permitido en la expresión: "${input[index]}"`)
    tokens.push(match[1])
    index = regex.lastIndex
  }
  return tokens
}

/** Analizador descendente recursivo. */
function parse (tokens) {
  let pos = 0
  const peek = () => tokens[pos]
  const eat = (token) => { if (peek() === token) { pos++; return true } return false }

  function expression () {
    let value = term()
    while (peek() === '+' || peek() === '-') {
      const op = tokens[pos++]
      const right = term()
      value = op === '+' ? value + right : value - right
    }
    return value
  }

  function term () {
    let value = factor()
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = tokens[pos++]
      const right = factor()
      if ((op === '/' || op === '%') && right === 0) throw new UserError('❌ No se puede dividir entre cero.')
      value = op === '*' ? value * right : op === '/' ? value / right : value % right
    }
    return value
  }

  function factor () {
    const base = unary()
    if (eat('^')) return base ** factor()
    return base
  }

  function unary () {
    if (eat('-')) return -unary()
    if (eat('+')) return unary()
    return primary()
  }

  function primary () {
    const token = tokens[pos]
    if (token === undefined) throw new UserError('❌ Expresión incompleta.')
    if (eat('(')) {
      const value = expression()
      if (!eat(')')) throw new UserError('❌ Falta cerrar un paréntesis.')
      return value
    }
    if (/^\d|^\./.test(token)) { pos++; return Number(token) }
    if (/^[A-Za-z]+$/.test(token)) {
      pos++
      const name = token.toLowerCase()
      if (name in CONSTANTS) return CONSTANTS[name]
      if (name in FUNCTIONS) {
        if (!eat('(')) throw new UserError(`❌ Falta "(" después de ${name}.`)
        const value = expression()
        if (!eat(')')) throw new UserError('❌ Falta cerrar un paréntesis.')
        return FUNCTIONS[name](value)
      }
      throw new UserError(`❌ Función o constante desconocida: ${name}`)
    }
    throw new UserError(`❌ Token inesperado: ${token}`)
  }

  const result = expression()
  if (pos !== tokens.length) throw new UserError('❌ Expresión no válida.')
  return result
}

export default {
  name: 'calc',
  aliases: ['calcular', 'calculadora'],
  category: 'tools',
  args: '<expresión>',
  description: 'Calculadora (+ - * / % ^, sqrt, sin, log...)',
  example: 'calc (5+3)*2^3',
  limit: false,
  premium: false,
  owner: false,
  admin: false,

  async exec ({ m, text }) {
    const expression = text.replace(/[×x]/g, '*').replace(/÷/g, '/').replace(/,/g, '.')
    if (expression.length > 200) throw new UserError('❌ La expresión es demasiado larga.')
    const result = parse(tokenize(expression))
    if (!Number.isFinite(result)) throw new UserError('❌ El resultado no es un número válido.')
    await m.reply(`🧮 *Calculadora*\n\n${expression} = *${Number(result.toFixed(10))}*`)
  }
}
