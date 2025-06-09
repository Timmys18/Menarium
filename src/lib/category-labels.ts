import { ThingCategory, ServiceCategory } from "@/types";

export const ThingCategoryLabels: Record<ThingCategory, string> = {
  ELECTRONICS: "Электроника",
  CLOTHING: "Одежда",
  FURNITURE: "Мебель",
  TOOLS: "Инструменты",
  KIDS: "Детские товары",
  BOOKS: "Книги",
  SPORTS: "Спорт",
  AUTO: "Авто",
  PETS: "Животные",
};

export const ServiceCategoryLabels: Record<ServiceCategory, string> = {
  EDUCATION: "Образование",
  HOUSEHOLD: "Бытовые услуги",
  BEAUTY: "Красота",
  REPAIR: "Ремонт",
  DOCUMENTS: "Документы",
  CREATIVE: "Креатив",
  IT: "IT / Технологии",
  AUTO: "Авто",
};
