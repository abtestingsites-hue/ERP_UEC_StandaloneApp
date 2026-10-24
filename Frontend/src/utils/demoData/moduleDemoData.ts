import { erpDemoData, type DemoModuleData, type DemoModuleKey } from '../../mock-data/erpDemoData'

export const getDemoModuleData = (key: DemoModuleKey): DemoModuleData => erpDemoData[key]

export type { DemoModuleData, DemoModuleKey, DemoRow } from '../../mock-data/erpDemoData'
