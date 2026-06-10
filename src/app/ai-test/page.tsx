
"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, CheckCircle2, AlertCircle, Cpu, FileCode, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AITestPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ response: string; modelUsed: string; raw?: any } | null>(null);
  const [error, setError] = useState<{ message: string; raw?: string; status?: number } | null>(null);
  const [apiStatus, setApiStatus] = useState<string | null>(null);
  const { toast } = useToast();

  const checkApiHealth = async () => {
    try {
      const res = await fetch('/api/test-ai');
      const data = await res.json();
      setApiStatus(data.ok ? "المسار يعمل بشكل صحيح (JSON)" : "فشل التحقق");
    } catch (err) {
      setApiStatus("لا يمكن الوصول للمسار (قد يكون HTML)");
    }
  };

  const handleTest = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const contentType = response.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (!response.ok) {
          setError({
            message: data.error || 'فشل الاتصال بـ OpenRouter',
            raw: JSON.stringify(data, null, 2),
            status: response.status
          });
        } else {
          setResult(data);
          toast({
            title: "تم الاتصال بنجاح",
            description: "استجاب المساعد الذكي بشكل صحيح.",
          });
        }
      } else {
        const rawText = await response.text();
        setError({
          message: `استجابة غير صالحة (HTML): ${response.status}`,
          raw: rawText.substring(0, 1000),
          status: response.status
        });
      }
    } catch (err: any) {
      setError({ message: err.message });
      toast({
        variant: "destructive",
        title: "فشل الاختبار",
        description: "حدث خطأ أثناء محاولة الاتصال.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold font-headline mb-2">اختبار OpenRouter المباشر</h1>
            <p className="text-muted-foreground">التواصل مع API مباشرة لتجاوز مشاكل التنسيق.</p>
          </div>
          <Button variant="outline" onClick={checkApiHealth} className="gap-2">
            <Globe className="h-4 w-4" />
            فحص المسار (GET)
          </Button>
        </div>

        {apiStatus && (
          <Alert className={apiStatus.includes("صحيح") ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}>
            <AlertTitle>حالة المسار:</AlertTitle>
            <AlertDescription>{apiStatus}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              إرسال طلب POST
            </CardTitle>
            <CardDescription>
              النموذج النشط: <span className="font-mono text-primary">{result?.modelUsed || "جاري التحميل..."}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder="اكتب رسالة اختبار..." 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTest()}
                className="text-lg h-12"
              />
              <Button 
                onClick={handleTest} 
                disabled={loading || !prompt.trim()}
                className="h-12 px-6"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>

            {error && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>خطأ في الاستجابة (الحالة: {error.status || 'Internal Error'})</AlertTitle>
                  <AlertDescription>
                    {error.message}
                  </AlertDescription>
                </Alert>

                {error.raw && (
                  <Card className="border-destructive/20 bg-black">
                    <CardHeader className="py-2 px-4 border-b border-white/10">
                      <div className="flex items-center gap-2 text-xs font-bold text-white uppercase">
                        <FileCode className="h-3 w-3" />
                        الاستجابة الخام (Raw Response)
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <pre className="text-emerald-400 font-mono text-[10px] overflow-auto max-h-[300px] whitespace-pre-wrap">
                        {error.raw}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {result && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-2 rounded-lg text-sm border border-emerald-100">
                  <CheckCircle2 className="h-4 w-4" />
                  تم استلام الرد بنجاح من النموذج: {result.modelUsed}
                </div>
                <Card className="bg-secondary/10 border-none shadow-inner">
                  <CardContent className="p-4">
                    <p className="whitespace-pre-wrap leading-relaxed text-lg">
                      {result.response}
                    </p>
                  </CardContent>
                </Card>
                <details className="text-[10px] text-muted-foreground opacity-50 cursor-pointer">
                  <summary>عرض بيانات JSON الكاملة</summary>
                  <pre className="mt-2 p-2 bg-muted rounded">{JSON.stringify(result.raw, null, 2)}</pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}




