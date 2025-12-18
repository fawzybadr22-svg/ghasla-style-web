import { useState } from "react";
import { Link, useParams } from "wouter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Calendar, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { BlogPost } from "@shared/schema";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function Blog() {
  const { t, i18n } = useTranslation();
  const params = useParams<{ id?: string }>();
  const isRTL = i18n.language === "ar";

  const getLocalizedText = (ar: string, en: string, fr: string) => {
    return i18n.language === "ar" ? ar : i18n.language === "fr" ? fr : en;
  };

  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"]
  });

  const { data: singlePost } = useQuery<BlogPost>({
    queryKey: ["/api/blog", params.id],
    enabled: !!params.id
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString(i18n.language === "ar" ? "ar-KW" : i18n.language === "fr" ? "fr-FR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  if (params.id && singlePost) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="py-12"
      >
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div variants={fadeInUp}>
            <Link href="/blog">
              <Button variant="ghost" className="mb-6" data-testid="button-back-to-blog">
                {isRTL ? <ArrowRight className="h-4 w-4 ltr:mr-2 rtl:ml-2" /> : <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2" />}
                {getLocalizedText("العودة للمدونة", "Back to Blog", "Retour au Blog")}
              </Button>
            </Link>
          </motion.div>

          <motion.article variants={fadeInUp} className="space-y-6">
            {singlePost.imageUrl && (
              <img
                src={singlePost.imageUrl}
                alt={getLocalizedText(singlePost.titleAr, singlePost.titleEn, singlePost.titleFr)}
                className="w-full h-64 md:h-96 object-cover rounded-lg"
              />
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(singlePost.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {getLocalizedText("5 دقائق قراءة", "5 min read", "5 min de lecture")}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold">
              {getLocalizedText(singlePost.titleAr, singlePost.titleEn, singlePost.titleFr)}
            </h1>

            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {getLocalizedText(singlePost.contentAr, singlePost.contentEn, singlePost.contentFr)}
              </p>
            </div>
          </motion.article>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="py-12"
    >
      <div className="container mx-auto px-4">
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {getLocalizedText("مدونة غسلة ستايل", "Ghasla Style Blog", "Blog Ghasla Style")}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {getLocalizedText(
              "نصائح وإرشادات للعناية بسيارتك وآخر أخبار خدماتنا",
              "Tips and guidance for car care and our latest service news",
              "Conseils et astuces pour l'entretien de votre voiture et nos dernières actualités"
            )}
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {posts.map((post) => (
              <motion.div key={post.id} variants={fadeInUp}>
                <Link href={`/blog/${post.id}`}>
                  <Card className="h-full hover-elevate cursor-pointer overflow-hidden" data-testid={`card-blog-${post.id}`}>
                    {post.imageUrl && (
                      <img
                        src={post.imageUrl}
                        alt={getLocalizedText(post.titleAr, post.titleEn, post.titleFr)}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.createdAt)}
                      </div>
                      <h3 className="font-semibold text-lg line-clamp-2">
                        {getLocalizedText(post.titleAr, post.titleEn, post.titleFr)}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {getLocalizedText(post.contentAr, post.contentEn, post.contentFr)}
                      </p>
                      <Button variant="ghost" className="p-0 h-auto text-primary">
                        {getLocalizedText("اقرأ المزيد", "Read More", "Lire la suite")}
                        {isRTL ? <ArrowLeft className="h-4 w-4 ltr:ml-1 rtl:mr-1" /> : <ArrowRight className="h-4 w-4 ltr:ml-1 rtl:mr-1" />}
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {getLocalizedText("لا توجد مقالات حالياً", "No articles yet", "Aucun article pour le moment")}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
