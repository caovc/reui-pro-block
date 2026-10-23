import type { BlockProps } from '@/data/types'
import { FundInflows, TrainingVolume, InventoryVelocity, TransitTargets } from './bar-comparisons'
import { RunnerLoad, RunDurations, AuditVolume, FirewallTraffic } from './bar-operations'
import { BudgetBurn, SloBurnRate, SyncActivity, SyncHistory } from './bar-slo-sync'
const components={ 'chart-9':FundInflows,'chart-10':TrainingVolume,'chart-29':InventoryVelocity,'chart-30':TransitTargets,'chart-32':RunnerLoad,'chart-33':RunDurations,'chart-35':AuditVolume,'chart-40':FirewallTraffic,'chart-42':BudgetBurn,'chart-43':SloBurnRate,'chart-45':SyncActivity,'chart-47':SyncHistory }
export default function BarChartBlock({block}:BlockProps){const Component=components[block.id as keyof typeof components];return Component?<Component/>:null}
