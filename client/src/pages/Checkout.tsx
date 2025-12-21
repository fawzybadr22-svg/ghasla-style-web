import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle, XCircle, Loader2, Shield, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Payment, Order, ServicePackage } from "@shared/schema";

export default function Checkout() {
  const { t, i18n } = useTranslation();
  const [, params] = useRoute("/payment/checkout/:paymentId");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isRTL = i18n.language === "ar";
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentId = params?.paymentId;

  const { data: payment, isLoading: paymentLoading, refetch: refetchPayment } = useQuery<Payment>({
    queryKey: ["/api/payments", paymentId],
    enabled: !!paymentId,
  });

  const { data: order, isLoading: orderLoading } = useQuery<Order>({
    queryKey: ["/api/orders", payment?.orderId],
    enabled: !!payment?.orderId,
  });

  const { data: servicePackage } = useQuery<ServicePackage>({
    queryKey: ["/api/packages", order?.servicePackageId],
    enabled: !!order?.servicePackageId,
  });

  const simulateSuccessMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/payments/${paymentId}/simulate-success`);
    },
    onSuccess: () => {
      refetchPayment();
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: isRTL ? "تم الدفع بنجاح" : "Payment Successful",
        description: isRTL ? "شكراً لك! تم تأكيد طلبك." : "Thank you! Your order has been confirmed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: isRTL ? "خطأ" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const simulateFailureMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/payments/${paymentId}/simulate-failure`, { errorMessage: "Payment declined by bank" });
    },
    onSuccess: () => {
      refetchPayment();
      toast({
        title: isRTL ? "فشل الدفع" : "Payment Failed",
        description: isRTL ? "تم رفض الدفع. يرجى المحاولة مرة أخرى." : "Payment was declined. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePayWithKNET = async () => {
    setIsProcessing(true);
    await simulateSuccessMutation.mutateAsync();
    setIsProcessing(false);
  };

  const handleCancel = async () => {
    await simulateFailureMutation.mutateAsync();
    navigate("/account");
  };

  const getServiceName = () => {
    if (!servicePackage) return "";
    if (i18n.language === "ar") return servicePackage.nameAr;
    if (i18n.language === "fr") return servicePackage.nameFr;
    return servicePackage.nameEn;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "captured":
        return <Badge variant="default" className="bg-green-500">{isRTL ? "تم الدفع" : "Paid"}</Badge>;
      case "failed":
        return <Badge variant="destructive">{isRTL ? "فشل" : "Failed"}</Badge>;
      case "cancelled":
        return <Badge variant="secondary">{isRTL ? "ملغي" : "Cancelled"}</Badge>;
      case "pending":
      case "initiated":
        return <Badge variant="outline">{isRTL ? "في انتظار الدفع" : "Pending"}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (paymentLoading || orderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">
              {isRTL ? "الدفع غير موجود" : "Payment Not Found"}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isRTL ? "لم يتم العثور على تفاصيل الدفع المطلوبة." : "The requested payment details could not be found."}
            </p>
            <Button onClick={() => navigate("/")}>
              {isRTL ? "العودة للرئيسية" : "Go to Home"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (payment.status === "captured") {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2 text-green-600">
                {isRTL ? "تم الدفع بنجاح!" : "Payment Successful!"}
              </h2>
              <p className="text-muted-foreground mb-6">
                {isRTL 
                  ? "شكراً لك! تم تأكيد طلبك وسيتم التواصل معك قريباً." 
                  : "Thank you! Your order has been confirmed and we will contact you soon."}
              </p>
              
              <div className="bg-muted rounded-lg p-4 mb-6 text-start">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">{isRTL ? "رقم الطلب:" : "Order ID:"}</span>
                  <span className="font-mono text-sm">{payment.orderId?.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">{isRTL ? "المبلغ:" : "Amount:"}</span>
                  <span className="font-bold">{payment.amountKD} KD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRTL ? "طريقة الدفع:" : "Payment Method:"}</span>
                  <span>{payment.cardBrand || "KNET"}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button onClick={() => navigate("/track-order")} className="w-full">
                  {isRTL ? "تتبع الطلب" : "Track Order"}
                </Button>
                <Button variant="outline" onClick={() => navigate("/")}>
                  {isRTL ? "العودة للرئيسية" : "Go to Home"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (payment.status === "failed" || payment.status === "cancelled") {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-20 w-20 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-destructive">
              {isRTL ? "فشل الدفع" : "Payment Failed"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {payment.errorMessage || (isRTL 
                ? "تعذر إتمام عملية الدفع. يرجى المحاولة مرة أخرى." 
                : "The payment could not be completed. Please try again.")}
            </p>
            
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/booking")} className="w-full">
                {isRTL ? "حاول مرة أخرى" : "Try Again"}
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                {isRTL ? "العودة للرئيسية" : "Go to Home"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">
                {isRTL ? "إتمام الدفع" : "Complete Payment"}
              </CardTitle>
              <CardDescription>
                {isRTL 
                  ? "أكمل عملية الدفع لتأكيد طلبك" 
                  : "Complete your payment to confirm your order"}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  {isRTL ? "تفاصيل الطلب" : "Order Summary"}
                </h3>
                
                {order && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRTL ? "الخدمة:" : "Service:"}</span>
                      <span className="font-medium">{getServiceName()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRTL ? "نوع السيارة:" : "Car Type:"}</span>
                      <span>{order.carType === "sedan" ? (isRTL ? "سيدان" : "Sedan") : (isRTL ? "دفع رباعي" : "SUV")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRTL ? "المنطقة:" : "Area:"}</span>
                      <span>{order.area}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRTL ? "التاريخ:" : "Date:"}</span>
                      <span>{order.preferredDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRTL ? "الوقت:" : "Time:"}</span>
                      <span>{order.preferredTime}</span>
                    </div>
                  </div>
                )}
                
                <Separator className="my-4" />
                
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">{isRTL ? "المجموع:" : "Total:"}</span>
                  <span className="text-2xl font-bold text-primary">{payment.amountKD} KD</span>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                    {isRTL ? "دفع آمن" : "Secure Payment"}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {isRTL 
                      ? "معاملاتك محمية ومشفرة بالكامل" 
                      : "Your transaction is protected and fully encrypted"}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-center">
                  {isRTL ? "اختر طريقة الدفع" : "Select Payment Method"}
                </h4>
                
                <Button 
                  className="w-full h-14 text-lg gap-2" 
                  onClick={handlePayWithKNET}
                  disabled={isProcessing || simulateSuccessMutation.isPending}
                  data-testid="button-pay-knet"
                >
                  {isProcessing || simulateSuccessMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {isRTL ? "جاري المعالجة..." : "Processing..."}
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      {isRTL ? "الدفع عبر كي نت" : "Pay with KNET"}
                      {isRTL ? <ArrowLeft className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
                    </>
                  )}
                </Button>
                
                <div className="text-center text-xs text-muted-foreground">
                  {isRTL 
                    ? "بيئة اختبار - لن يتم خصم أي مبلغ حقيقي" 
                    : "Test environment - No real charges will be made"}
                </div>
              </div>
              
              <div className="flex justify-center pt-4">
                <Button 
                  variant="ghost" 
                  onClick={handleCancel}
                  disabled={simulateFailureMutation.isPending}
                  data-testid="button-cancel-payment"
                >
                  {isRTL ? "إلغاء الدفع" : "Cancel Payment"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
