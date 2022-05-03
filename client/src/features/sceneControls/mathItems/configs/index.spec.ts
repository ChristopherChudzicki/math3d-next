import { MathItemType as MIT } from 'types'
import { configs, make } from './index'

test.each([
  // replace this with Object.values(MIT) once all configs are ready
  MIT.Point,
  MIT.Variable
] as const)('config %p has all properties', (type) => {
  const item = make('test', type)
  const { properties } = configs[type]
  const expectedProperties = Object.keys(properties).sort()
  const configuredProperties = properties.map(p => p.name).sort()
  expect(configuredProperties).toStrictEqual(expectedProperties)
})