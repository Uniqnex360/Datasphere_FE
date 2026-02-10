import { useEffect, useState } from "react"
import { MasterAPI } from "../lib/api"

const PriceManagement = () => {
  const [loading,setLoading]=useState(false)
  const [toast,setToast]=useState<{message:string,type:'success'|'error'}|null>(null)
  const [vendors,setVendors]=useState<VendorData[]>([])
  const [brands,setBrands]=useState<BrandData[]>([])
  const [categories,setCategories]=useState<any[]>([])
  const [selectedVendorCode,setSelectedVendorCode]=useState<string>("")
  const [selectedBrandCode,setSelectedBrandCode]=useState<string>('')
  const [selectedCategory,setSelectedCategory]=useState<string[]>([])
  const [priceValue,setPriceValue]=useState<number>(0)
  const [priceOption,setPriceOption]=useState('finished_price')
  const [adjustmentType,setAdjustmentType]=useState<"amount"|'percentage'>('amount')
  useEffect(()=>{
    loadInitialData()
  })
  const loadInitialData=async()=>{
    try {
      setLoading(true)
      const [vendorData,brandata,catData]=await Promise.all([
        MasterAPI.getVendors(),
        MasterAPI.getBrands(),
        MasterAPI.getCategories()

      ])
      setVendors(vendorData||[])
      setBrands(brandata||[])
      setCategories(catData||[])
    } catch (error) {
      setToast({message:"Failed to load master data",type:'error'})
    }
    finally{
      setLoading(false)
    }
  }
  const handleFileUpload=async()=>{
    
  }
  return (
    <div>PriceManagement</div>
  )
}

export default PriceManagement