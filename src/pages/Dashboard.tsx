import { useEffect, useState } from 'react';
import {
  Package,
  TrendingUp,
  TrendingDown,
  ImageOff,
  Tag,
  Building2,
  Truck,
  Upload,
  Download,
  Clock,
  AlertCircle,
  CheckCircle,
  FolderTree,
} from 'lucide-react';
import { CategoryCoverageChart } from '../components/CategoryCoverageChart';
import { BrandProductChart } from '../components/BrandProductChart';
import { DataCompletenessChart } from '../components/DataCompletenessChart';
import { MasterAPI, ProductAPI } from '../lib/api';

interface DashboardStats {
  totalProducts: number;
  productsMissingAttributes: number;
  productsMissingImages: number;
  unassignedCategories: number;
  totalBrands: number;
  totalVendors: number;
  recentlyUpdated: number;
  trend: {
    products: number;
    brands: number;
    vendors: number;
  };
}

interface IndustryHealth {
  industry_name: string;
  product_count: number;
  completed_percentage: number;
  missing_attributes_percentage: number;
  missing_images_percentage: number;
}

interface RecentActivity {
  id: string;
  action: string;
  timestamp: string;
  user: string;
}

interface CategoryData {
  parent_category: string;
  total_products: number;
  subcategories: Array<{
    subcategory: string;
    product_count: number;
  }>;
}

interface BrandData {
  brand_name: string;
  product_count: number;
}

interface CompletenessData {
  name: string;
  completeness: number;
  total_products: number;
  complete_products: number;
}

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    productsMissingAttributes: 0,
    productsMissingImages: 0,
    unassignedCategories: 0,
    totalBrands: 0,
    totalVendors: 0,
    recentlyUpdated: 0,
    trend: { products: 0, brands: 0, vendors: 0 },
  });
  const [industryHealth, setIndustryHealth] = useState<IndustryHealth[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [brandData, setBrandData] = useState<BrandData[]>([]);
  const [brandCompleteness, setBrandCompleteness] = useState<CompletenessData[]>([]);
  const [industryCompleteness, setIndustryCompleteness] = useState<CompletenessData[]>([]);
  const [loading, setLoading] = useState(true);
  const [completenessScore, setCompletenessScore] = useState(0);
  const [basicInfoScore, setBasicInfoScore] = useState(0);
  const [attributesScore, setAttributesScore] = useState(0);
  const [imagesScore, setImagesScore] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

    const loadDashboardData = async () => {
    try {
      setLoading(true);
      // NEW: Fetch all data from API in parallel
      const [products, brands, vendors, categories] = await Promise.all([
        ProductAPI.getAll(0, 1000), // Get enough products for stats
        MasterAPI.getBrands(),
        MasterAPI.getVendors(),
        MasterAPI.getCategories()
      ]);

      if (products) {
        const totalProducts = products.length;

        // --- Calculate Stats Logic (Adapted for API response) ---
        const missingAttributes = products.filter((p: any) => {
            const attrs = p.attributes || {};
            return Object.keys(attrs).length === 0;
        }).length;

        const missingImages = products.filter((p: any) => !p.image_url_1).length;

        const unassignedCategories = products.filter((p: any) => 
            !p.category_code && !p.category_1
        ).length;

        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const recentlyUpdated = products.filter((p: any) => {
          return p.updated_at && new Date(p.updated_at) > oneDayAgo;
        }).length;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const productsLastWeek = products.filter((p: any) => {
          return p.created_at && new Date(p.created_at) > sevenDaysAgo;
        }).length;

        const totalCompletenessScore = products.reduce((sum: number, p: any) => sum + (p.completeness_score || 0), 0);
        const completeness = totalProducts > 0 ? Math.round(totalCompletenessScore / totalProducts) : 0;

        // Basic Info Score
        const basicInfoComplete = products.filter((p: any) =>
          p.product_name && p.brand_name && (p.category_code || p.category_1)
        ).length;
        const basicInfo = totalProducts > 0 ? Math.round((basicInfoComplete / totalProducts) * 100) : 0;

        // Attributes Score
        const attrComplete = products.filter((p: any) => p.attributes && Object.keys(p.attributes).length > 0).length;
        const attributesScoreVal = totalProducts > 0 ? Math.round((attrComplete / totalProducts) * 100) : 0;

        // Images Score
        const imagesComplete = products.filter((p: any) => p.image_url_1).length;
        const imagesScoreVal = totalProducts > 0 ? Math.round((imagesComplete / totalProducts) * 100) : 0;

        setStats({
          totalProducts,
          productsMissingAttributes: missingAttributes,
          productsMissingImages: missingImages,
          unassignedCategories,
          totalBrands: brands?.length || 0,
          totalVendors: vendors?.length || 0,
          recentlyUpdated,
          trend: {
            products: productsLastWeek,
            brands: 0, 
            vendors: 0, 
          },
        });

        setCompletenessScore(completeness);
        setBasicInfoScore(basicInfo);
        setAttributesScore(attributesScoreVal);
        setImagesScore(imagesScoreVal);

        // --- Industry Health ---
        const industryMap = new Map<string, any>();
        products.forEach((p: any) => {
          const industry = p.industry_name || 'Unassigned';
          if (!industryMap.has(industry)) {
            industryMap.set(industry, {
              industry_name: industry,
              product_count: 0,
              totalCompleteness: 0,
              missingAttr: 0,
              missingImg: 0,
            });
          }
          const entry = industryMap.get(industry);
          entry.product_count++;
          entry.totalCompleteness += (p.completeness_score || 0);
          
          if (!p.attributes || Object.keys(p.attributes).length === 0) entry.missingAttr++;
          if (!p.image_url_1) entry.missingImg++;
        });

        const healthData: IndustryHealth[] = Array.from(industryMap.values()).map((entry) => ({
          industry_name: entry.industry_name,
          product_count: entry.product_count,
          completed_percentage: entry.product_count > 0 ? Math.round(entry.totalCompleteness / entry.product_count) : 0,
          missing_attributes_percentage: entry.product_count > 0 ? Math.round((entry.missingAttr / entry.product_count) * 100) : 0,
          missing_images_percentage: entry.product_count > 0 ? Math.round((entry.missingImg / entry.product_count) * 100) : 0,
        }));
        setIndustryHealth(healthData);

        // --- Recent Activity ---
        const activities: RecentActivity[] = products
          .slice(0, 20)
          .map((p: any, idx: number) => ({
            id: `${p.product_code}-${idx}`,
            action: `Product ${p.product_code} updated`,
            timestamp: p.updated_at || new Date().toISOString(),
            user: 'System', 
          }));
        setRecentActivities(activities);

        // --- Category Coverage ---
        const categoryMap = new Map<string, CategoryData>();
        products.forEach((p: any) => {
          const parent = p.category_1 || 'Uncategorized';
          const productType = p.product_type || 'General';

          if (!categoryMap.has(parent)) {
            categoryMap.set(parent, {
              parent_category: parent,
              total_products: 0,
              subcategories: [],
            });
          }
          const catData = categoryMap.get(parent)!;
          catData.total_products++;
          
          const existingSub = catData.subcategories.find((s) => s.subcategory === productType);
          if (existingSub) {
            existingSub.product_count++;
          } else {
            catData.subcategories.push({
              subcategory: productType,
              product_count: 1,
            });
          }
        });
        setCategoryData(Array.from(categoryMap.values()));

const brandCounts: any = {};
products.forEach((p: any) => {
     console.log("Product brand data:", p.brand_name, p.brand_code);
     const b = p.brand_name || 'Unknown';
     brandCounts[b] = (brandCounts[b] || 0) + 1;
});
        const brandDataArray = Object.keys(brandCounts).map(k => ({ brand_name: k, product_count: brandCounts[k] }));
        setBrandData(brandDataArray);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trend: stats.trend.products,
      trendUp: true,
    },
    {
      title: 'Missing Attributes',
      value: stats.productsMissingAttributes,
      icon: AlertCircle,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      trend: 0,
      trendUp: false,
    },
    {
      title: 'Missing Images',
      value: stats.productsMissingImages,
      icon: ImageOff,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      trend: 0,
      trendUp: false,
    },
    {
      title: 'Unassigned Categories',
      value: stats.unassignedCategories,
      icon: FolderTree,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      trend: 0,
      trendUp: false,
    },
    {
      title: 'Total Brands',
      value: stats.totalBrands,
      icon: Tag,
      bgColor: 'bg-teal-50',
      iconColor: 'text-teal-600',
      trend: stats.trend.brands,
      trendUp: true,
    },
    {
      title: 'Total Vendors',
      value: stats.totalVendors,
      icon: Truck,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      trend: stats.trend.vendors,
      trendUp: true,
    },
    {
      title: 'Recently Updated',
      value: stats.recentlyUpdated,
      icon: Clock,
      bgColor: 'bg-violet-50',
      iconColor: 'text-violet-600',
      trend: 0,
      trendUp: true,
    },
    {
      title: 'Completeness Score',
      value: `${completenessScore}%`,
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      trend: 0,
      trendUp: true,
    },
  ];

  const quickActions = [
    { label: 'Add Product', icon: Package, onClick: () => onNavigate?.('products'), color: 'blue' },
    { label: 'Import Products', icon: Upload, onClick: () => onNavigate?.('import-export'), color: 'green' },
    { label: 'Export Products', icon: Download, onClick: () => onNavigate?.('import-export'), color: 'teal' },
    { label: 'Add Attribute', icon: Tag, onClick: () => onNavigate?.('attributes'), color: 'orange' },
    { label: 'Manage Categories', icon: FolderTree, onClick: () => onNavigate?.('categories'), color: 'violet' },
    { label: 'Manage Brands', icon: Tag, onClick: () => onNavigate?.('brands'), color: 'pink' },
    { label: 'Manage Vendors', icon: Building2, onClick: () => onNavigate?.('vendors'), color: 'cyan' },
  ];

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Catalog overview and health metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`${card.iconColor}`} size={24} />
                </div>
                {card.trend !== 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    {card.trendUp ? (
                      <TrendingUp size={16} className="text-green-600" />
                    ) : (
                      <TrendingDown size={16} className="text-red-600" />
                    )}
                    <span className={card.trendUp ? 'text-green-600' : 'text-red-600'}>
                      {Math.abs(card.trend)}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{card.value}</h3>
              <p className="text-sm text-gray-600">{card.title}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Completeness</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Completeness</span>
                <span className="text-2xl font-bold text-blue-600">{completenessScore}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${completenessScore}%` }}
                ></div>
              </div>
            </div>
            <div className="pt-4 border-t space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Basic Info</span>
                  <span className="font-medium">{basicInfoScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${basicInfoScore >= 80 ? 'bg-green-500' : basicInfoScore >= 60 ? 'bg-yellow-500' : 'bg-orange-500'}`} style={{ width: `${basicInfoScore}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Attributes</span>
                  <span className="font-medium">{attributesScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${attributesScore >= 80 ? 'bg-green-500' : attributesScore >= 60 ? 'bg-yellow-500' : 'bg-orange-500'}`} style={{ width: `${attributesScore}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Images</span>
                  <span className="font-medium">{imagesScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${imagesScore >= 80 ? 'bg-green-500' : imagesScore >= 60 ? 'bg-yellow-500' : 'bg-orange-500'}`} style={{ width: `${imagesScore}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Catalog Health by Industry</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Industry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    # Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    % Complete
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Missing Attr
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Missing Img
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {industryHealth.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No data available
                    </td>
                  </tr>
                ) : (
                  industryHealth.map((industry) => (
                    <tr key={industry.industry_name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {industry.industry_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {industry.product_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            industry.completed_percentage >= 80
                              ? 'bg-green-100 text-green-800'
                              : industry.completed_percentage >= 60
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {industry.completed_percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {industry.missing_attributes_percentage}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {industry.missing_images_percentage}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className="flex flex-col items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className={`p-3 rounded-lg bg-${action.color}-50 group-hover:bg-${action.color}-100 transition-colors`}>
                  <Icon className={`text-${action.color}-600`} size={24} />
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Category Coverage</h2>
            <p className="text-sm text-gray-600 mt-1">Product distribution across categories</p>
          </div>
          <div className="p-6">
            <CategoryCoverageChart data={categoryData} onNavigate={onNavigate} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Product Count by Brand</h2>
            <p className="text-sm text-gray-600 mt-1">Top brands by product count</p>
          </div>
          <div className="p-6">
            <BrandProductChart data={brandData} onNavigate={onNavigate} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Completeness by Brand</h2>
            <p className="text-sm text-gray-600 mt-1">Data quality metrics per brand</p>
          </div>
          <div className="p-6">
            <DataCompletenessChart data={brandCompleteness} title="Brand Completeness" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Completeness by Industry</h2>
            <p className="text-sm text-gray-600 mt-1">Data quality metrics per industry</p>
          </div>
          <div className="p-6">
            <DataCompletenessChart data={industryCompleteness} title="Industry Completeness" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentActivities.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No recent activity</p>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Package size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{activity.action}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.user} · {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Review Queue</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Issues
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No items in review queue
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
