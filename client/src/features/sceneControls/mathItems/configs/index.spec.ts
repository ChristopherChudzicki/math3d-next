import { MathItemType as MIT } from 'types'
import { configs, defaultValues } from './index'

test.each([
  // replace this with Object.values(MIT) once all configs are ready
  MIT.Point,
  MIT.Variable
] as const)('config %p has all properties', (type) => {
  const expectedProperties = Object.keys(defaultValues[type]).sort()
  const { properties } = configs[type]
  const configuredProperties = properties.map(p => p.name).sort()
  expect(configuredProperties).toStrictEqual(expectedProperties)
})