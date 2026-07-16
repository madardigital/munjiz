export type Priority = 'منخفضة' | 'متوسطة' | 'عالية' | 'عاجلة'
export type AssignmentStatus = 'لم يبدأ' | 'جارٍ العمل' | 'يحتاج معلومات' | 'جاهز للمراجعة' | 'مكتمل'
export type AssignmentType = 'بحث' | 'تقرير' | 'عرض تقديمي' | 'واجب' | 'مشروع' | 'اختبار' | 'أخرى'

export interface Task {
  id: string
  title: string
  done: boolean
}

export interface Assignment {
  id: string
  title: string
  course: string
  instructor?: string
  type: AssignmentType
  dueAt: string
  priority: Priority
  status: AssignmentStatus
  instructions: string
  tasks: Task[]
  createdAt: string
}
