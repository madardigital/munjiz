import type { Assignment } from './types'

function futureDate(days: number, hour = 23): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, 59, 0, 0)
  return date.toISOString()
}

export const starterAssignments: Assignment[] = [
  {
    id: 'assignment-1',
    title: 'تقرير التدريب التعاوني',
    course: 'التدريب العملي',
    type: 'تقرير',
    dueAt: futureDate(3),
    priority: 'عالية',
    status: 'جارٍ العمل',
    instructions: 'إعداد التقرير النهائي، مراجعة التنسيق، وإرفاق الملاحق المطلوبة.',
    createdAt: new Date().toISOString(),
    tasks: [
      { id: 'task-1', title: 'مراجعة تعليمات التقرير', done: true },
      { id: 'task-2', title: 'كتابة المقدمة والتعريف بالجهة', done: true },
      { id: 'task-3', title: 'إضافة المهام والمهارات المكتسبة', done: true },
      { id: 'task-4', title: 'كتابة النتائج والتوصيات', done: false },
      { id: 'task-5', title: 'التنسيق والمراجعة النهائية', done: false }
    ]
  },
  {
    id: 'assignment-2',
    title: 'عرض الاتصال المؤسسي',
    course: 'العلاقات العامة',
    type: 'عرض تقديمي',
    dueAt: futureDate(7, 18),
    priority: 'متوسطة',
    status: 'لم يبدأ',
    instructions: 'عرض من 10 شرائح يتضمن مثالًا تطبيقيًا ومراجع مختصرة.',
    createdAt: new Date().toISOString(),
    tasks: [
      { id: 'task-6', title: 'اختيار الحالة التطبيقية', done: false },
      { id: 'task-7', title: 'كتابة محتوى الشرائح', done: false },
      { id: 'task-8', title: 'تصميم العرض', done: false }
    ]
  }
]
