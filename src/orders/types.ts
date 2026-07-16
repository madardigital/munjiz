export const orderStatuses = ['طلب جديد','بانتظار التفاصيل','بانتظار العربون','قيد التنفيذ','جاهز للمراجعة','بانتظار تعديل العميل','تم التسليم','مكتمل ومدفوع','ملغي'] as const
export const priorities = ['منخفضة','متوسطة','عالية','عاجلة'] as const
export const serviceTypes = ['بحث','تقرير','عرض تقديمي','واجب','مشروع','تصميم','تلخيص','تدقيق','استبانة','أخرى'] as const

export type OrderStatus = typeof orderStatuses[number]
export type Priority = typeof priorities[number]
export type ServiceType = typeof serviceTypes[number]

export type WorkTask = {
  id: string
  orderId?: string
  title: string
  dueAt?: string
  priority: Priority
  done: boolean
  notes: string
  createdAt: string
}

export type Payment = {
  id: string
  orderId: string
  amount: number
  paidAt: string
  method: string
  note: string
  createdAt: string
}

export type WorkOrder = {
  id: string
  clientName: string
  phone: string
  title: string
  serviceType: ServiceType
  courseOrEntity: string
  details: string
  receivedAt: string
  dueAt: string
  totalAmount: number
  paidAmount: number
  paymentMethod: string
  status: OrderStatus
  priority: Priority
  notes: string
  lastContactAt?: string
  createdAt: string
  updatedAt: string
  tasks: WorkTask[]
  payments: Payment[]
}

export type NewOrder = Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'payments'> & { taskTitles: string[] }
