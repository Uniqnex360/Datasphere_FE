import { Category, CategoryTreeNode } from '../types/category';

export function generateBreadcrumb(category: Category): string {
  const levels = [
    category.category_1,
    category.category_2,
    category.category_3,
    category.category_4,
    category.category_5,
    category.category_6,
    category.category_7,
    category.category_8,
  ].filter((level) => level && level.trim());

  return levels.join(' > ');
}

export function getCategoryLevel(category: Category): number {
  for (let i = 8; i >= 1; i--) {
    const level = category[`category_${i}` as keyof Category];
    if (level && String(level).trim()) {
      return i;
    }
  }
  return 0;
}

export function getCategoryName(category: Category): string {
  const level = getCategoryLevel(category);
  if (level === 0) return 'Unnamed';
  return String(category[`category_${level}` as keyof Category]);
}

export function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const nodeMap = new Map<string, CategoryTreeNode>();

  categories.forEach((category) => {
    nodeMap.set(category.category_code, {
      category,
      children: [],
      level: getCategoryLevel(category),
    });
  });

  const rootNodes: CategoryTreeNode[] = [];

  categories.forEach((category) => {
    const node = nodeMap.get(category.category_code)!;
    const level = getCategoryLevel(category);

    if (level === 1) {
      rootNodes.push(node);
    } else {
      let parentFound = false;
      for (const potentialParent of categories) {
        const parentLevel = getCategoryLevel(potentialParent);

        if (parentLevel === level - 1) {
          let matches = true;
          for (let i = 1; i < level; i++) {
            const categoryValue = category[`category_${i}` as keyof Category];
            const parentValue = potentialParent[`category_${i}` as keyof Category];
            if (categoryValue !== parentValue) {
              matches = false;
              break;
            }
          }

          if (matches) {
            const parentNode = nodeMap.get(potentialParent.category_code);
            if (parentNode) {
              parentNode.children.push(node);
              parentFound = true;
              break;
            }
          }
        }
      }

      if (!parentFound) {
        rootNodes.push(node);
      }
    }
  });

  return rootNodes;
}

export function findParentCategory(
  categories: Category[],
  childCategory: Category
): Category | null {
  const childLevel = getCategoryLevel(childCategory);

  if (childLevel <= 1) return null;

  for (const potentialParent of categories) {
    const parentLevel = getCategoryLevel(potentialParent);

    if (parentLevel === childLevel - 1) {
      let matches = true;
      for (let i = 1; i < childLevel; i++) {
        const childValue = childCategory[`category_${i}` as keyof Category];
        const parentValue = potentialParent[`category_${i}` as keyof Category];
        if (childValue !== parentValue) {
          matches = false;
          break;
        }
      }

      if (matches) {
        return potentialParent;
      }
    }
  }

  return null;
}

export function updateCategoryHierarchy(
  category: Category,
  newParent: Category | null,
  newName: string
): Partial<Category> {
  const updates: Partial<Category> = {};

  if (newParent) {
    const parentLevel = getCategoryLevel(newParent);
    const newLevel = parentLevel + 1;

    for (let i = 1; i <= 8; i++) {
      if (i <= parentLevel) {
        updates[`category_${i}` as keyof Category] = newParent[`category_${i}` as keyof Category] as any;
      } else if (i === newLevel) {
        updates[`category_${i}` as keyof Category] = newName as any;
      } else {
        updates[`category_${i}` as keyof Category] = '' as any;
      }
    }
  } else {
    for (let i = 1; i <= 8; i++) {
      if (i === 1) {
        updates[`category_${i}` as keyof Category] = newName as any;
      } else {
        updates[`category_${i}` as keyof Category] = '' as any;
      }
    }
  }

  updates.breadcrumb = generateBreadcrumb({ ...category, ...updates } as Category);

  return updates;
}

export function validateCategoryHierarchy(category: Partial<Category>): string[] {
  const errors: string[] = [];

  let foundEmpty = false;
  for (let i = 1; i <= 8; i++) {
    const level = category[`category_${i}` as keyof Category];
    if (level && String(level).trim()) {
      if (foundEmpty) {
        errors.push(`Category level ${i} cannot be filled when level ${i - 1} is empty`);
      }
    } else {
      foundEmpty = true;
    }
  }

  return errors;
}
