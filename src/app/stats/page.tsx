
"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from "recharts";
import { TrendingUp, Target, Award, Clock } from "lucide-react";

const productivityData = [
  { name: "الأحد", count: 8 },
  { name: "الاثنين", count: 12 },
  { name: "الثلاثاء", count: 10 },
  { name: "الأربعاء", count: 15 },
  { name: "الخميس", count: 14 },
  { name: "الجمعة", count: 4 },
  { name: "السبت", count: 2 },
];

const categoryData = [
  { name: "عمل", value: 45 },
  { name: "صحة", value: 20 },
  { name: "تعلم", value: 25 },
  { name: "ترفيه", value: 10 },
];

const COLORS = ['#2963CC', '#52B2BF', '#FFBB28', '#FF8042'];

export default function StatsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold font-headline mb-1">إحصائيات الإنتاجية</h1>
          <p className="text-muted-foreground">تابع تقدمك وحلل كيفية قضائك لوقتك.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4 bg-primary/5 border-primary/10">
            <div className="h-10 w-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">المهام المنجزة</p>
              <p className="text-xl font-bold">158</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4 bg-accent/5 border-accent/10">
            <div className="h-10 w-10 bg-accent/20 rounded-lg flex items-center justify-center text-accent">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">أفضل يوم</p>
              <p className="text-xl font-bold">الأربعاء</p>
            </div>
          </Card>
           <Card className="p-4 flex items-center gap-4 bg-amber-500/5 border-amber-500/10">
            <div className="h-10 w-10 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-500">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ساعات العمل</p>
              <p className="text-xl font-bold">42.5</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4 bg-emerald-500/5 border-emerald-500/10">
            <div className="h-10 w-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-500">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">نسبة النمو</p>
              <p className="text-xl font-bold">+12%</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إنجاز المهام الأسبوعي</CardTitle>
              <CardDescription>عدد المهام المنجزة لكل يوم من أيام الأسبوع</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productivityData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: '#f1f5f9' }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full bg-muted/20 animate-pulse rounded-lg" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">توزيع الوقت حسب الفئة</CardTitle>
              <CardDescription>كيف تقسم مجهودك بين الجوانب المختلفة</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="h-[300px] w-full max-w-[400px]">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full bg-muted/20 animate-pulse rounded-full" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
