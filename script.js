// ===== DATA & STATE =====
var presentations = [];
try {
    presentations = JSON.parse(localStorage.getItem('presentations') || '[]');
} catch(e) { presentations = []; }

var currentPres = null;
var currentSlide = 0;
var selectedCount = 10;
var selectedTheme = 'modern';
var currentLang = 'ar';

var THEMES = {
    modern: { bg1: '667eea', bg2: '764ba2', text: 'FFFFFF', dark: true, accent: '#667eea' },
    ocean: { bg1: '2193b0', bg2: '6dd5ed', text: 'FFFFFF', dark: true, accent: '#2193b0' },
    sunset: { bg1: 'f093fb', bg2: 'f5576c', text: 'FFFFFF', dark: true, accent: '#f5576c' },
    forest: { bg1: '11998e', bg2: '38ef7d', text: 'FFFFFF', dark: true, accent: '#11998e' },
    dark: { bg1: '232526', bg2: '414345', text: 'FFFFFF', dark: true, accent: '#414345' },
    warm: { bg1: 'ff9966', bg2: 'ff5e62', text: 'FFFFFF', dark: true, accent: '#ff5e62' },
    corporate: { bg1: '1e3a8a', bg2: '3b82f6', text: 'FFFFFF', dark: true, accent: '#3b82f6' },
    luxury: { bg1: '1a1a2e', bg2: '16213e', text: 'FFFFFF', dark: true, accent: '#0f3460' }
};

var PHOTO_IDS = {
    marketing: ['1460925895917-afdab827c52f','1552664730-d307ca884978','1542744173-8e7e53415bb0','1533750349088-cd871a92f312','1551288049-beb73de7d8b6','1504868584819-5a2cc9087b59'],
    education: ['1522202176988-66273c2fd55f','1503676260728-1c00da094a9b','1523240795612-165908db5cb9','1456513080510-7bf3a84b82f8','1497633762265-9d179a990aa6','1524178232363-1e1302b6d6e3'],
    business: ['1556761175-5973dc0f32e7','1553877522-43294d6775f3','1519389950476-29a8e9f4a419','1542744094-24638eff58bb','1551836022-d5d88e46d798','1521737711862-3b3a0f0c1f6f'],
    tech: ['1677442136019-21780ecad995','1518770667438-0b080b0b6566','1550751827-4bd374c3b6c4','1485827404703-89b55fcc595e','1526374965328-7f61d4dc18c5','1451187580459-43490279c0fa'],
    health: ['1506126613408-eca07ce68773','1571019613454-1cb2f99b2d8b','1571019614242-c5c5dee9e480','1505751172875-1e0a3c0e0e0e','1544367563-1234567890ab','1544367563-1234567890cd'],
    finance: ['1579621970563-ebec7560ff3e','1611974765270-ca1258435d2f','1554224155-8d328d2928e7','1460925895917-afdab827c52f','1551288049-beb73de7d8b6','1504868584819-5a2cc9087b59'],
    general: ['1456513080510-7bf3a84b82f8','1460925895917-afdab827c52f','1542744173-8e7e53415bb0','1552664730-d307ca884978','1522202176988-66273c2fd55f','1556761175-5973dc0f32e7']
};

// ===== LANGUAGE SYSTEM =====
function setLanguage(lang) {
    currentLang = lang;
    document.body.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.body.setAttribute('lang', lang);

    document.querySelectorAll('[data-en]').forEach(function(el) {
        el.textContent = el.getAttribute('data-' + lang);
    });

    document.querySelectorAll('[data-placeholder-en]').forEach(function(el) {
        el.placeholder = el.getAttribute('data-placeholder-' + lang);
    });

    document.querySelectorAll('.lang-btn').forEach(function(btn) {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    document.querySelectorAll('#langGroup .chip').forEach(function(chip) {
        chip.classList.toggle('active', chip.dataset.lang === lang);
    });

    localStorage.setItem('slidecraft_lang', lang);
}

// ===== NAVIGATION =====
function navigateTo(section) {
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });

    var target = document.getElementById(section + '-section');
    if (target) target.classList.add('active');

    var navItem = document.querySelector('.nav-item[data-section="' + section + '"]');
    if (navItem) navItem.classList.add('active');

    if (section === 'home' || section === 'library') renderPresentations();
    if (section === 'templates') renderTemplates();
}

document.querySelectorAll('.nav-item').forEach(function(item) {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        navigateTo(item.dataset.section);
    });
});

// ===== LANGUAGE TOGGLE =====
document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        setLanguage(btn.dataset.lang);
    });
});

document.querySelectorAll('#langGroup .chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
        document.querySelectorAll('#langGroup .chip').forEach(function(c) { c.classList.remove('active'); });
        chip.classList.add('active');
        setLanguage(chip.dataset.lang);
    });
});

// ===== QUICK START =====
function quickStart(topic, category) {
    document.getElementById('presTitle').value = topic;
    navigateTo('create');
}

// ===== FORM CONTROLS =====
document.querySelectorAll('#slideCountGroup .chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
        document.querySelectorAll('#slideCountGroup .chip').forEach(function(c) { c.classList.remove('active'); });
        chip.classList.add('active');
        selectedCount = parseInt(chip.dataset.count);
    });
});

document.querySelectorAll('[data-theme]').forEach(function(item) {
    item.addEventListener('click', function() {
        document.querySelectorAll('[data-theme]').forEach(function(t) { t.classList.remove('active'); });
        item.classList.add('active');
        selectedTheme = item.dataset.theme;
    });
});

// ===== IMAGE SYSTEM =====
function getTopicCategory(title) {
    var lower = (title || '').toLowerCase();
    if (lower.indexOf('marketing') !== -1 || lower.indexOf('تسويق') !== -1 || lower.indexOf('إعلان') !== -1) return 'marketing';
    if (lower.indexOf('education') !== -1 || lower.indexOf('تعليم') !== -1 || lower.indexOf('تدريب') !== -1 || lower.indexOf('مهارة') !== -1 || lower.indexOf('تعلم') !== -1) return 'education';
    if (lower.indexOf('business') !== -1 || lower.indexOf('أعمال') !== -1 || lower.indexOf('شركة') !== -1 || lower.indexOf('مشروع') !== -1 || lower.indexOf('startup') !== -1) return 'business';
    if (lower.indexOf('tech') !== -1 || lower.indexOf('تقن') !== -1 || lower.indexOf('برمج') !== -1 || lower.indexOf('ذكاء') !== -1 || lower.indexOf('ai') !== -1 || lower.indexOf('software') !== -1) return 'tech';
    if (lower.indexOf('health') !== -1 || lower.indexOf('صح') !== -1 || lower.indexOf('medical') !== -1 || lower.indexOf('طب') !== -1 || lower.indexOf('نفس') !== -1) return 'health';
    if (lower.indexOf('finance') !== -1 || lower.indexOf('مال') !== -1 || lower.indexOf('ميزانية') !== -1 || lower.indexOf('invest') !== -1 || lower.indexOf('استثمار') !== -1) return 'finance';
    return 'general';
}

function getSlideImage(category, slideIndex) {
    var ids = PHOTO_IDS[category] || PHOTO_IDS.general;
    var photoId = ids[slideIndex % ids.length];
    return 'https://images.unsplash.com/photo-' + photoId + '?w=960&h=540&fit=crop&q=80';
}

// ===== AI CONTENT GENERATION =====
async function generateAIContent(title, desc, count) {
    var fullTopic = title + (desc ? ' - ' + desc : '');
    var isAr = currentLang === 'ar';

    var prompt = isAr 
        ? 'Create a professional Arabic presentation about: "' + fullTopic + '"

Required: ' + (count - 2) + ' content slides (excluding title and closing).
For each slide: a short title + 3 detailed bullet points (full sentences).

Reply in JSON format only:
{
  "slides": [
    {"title": "...", "points": ["...", "...", "..."]},
    ...
  ]
}'
        : 'Create a professional English presentation about: "' + fullTopic + '"

Required: ' + (count - 2) + ' content slides (excluding title and closing).
For each slide: a short title + 3 detailed bullet points (full sentences).

Reply in JSON format only:
{
  "slides": [
    {"title": "...", "points": ["...", "...", "..."]},
    ...
  ]
}';

    try {
        showToast(isAr ? '&#129302; جاري توليد المحتوى بالذكاء الاصطناعي...' : '&#129302; Generating content with AI...');

        var slides = await tryFreeAIApis(prompt, isAr);
        if (slides && slides.length > 0) return slides;
        throw new Error('All APIs failed');

    } catch(error) {
        console.error('AI Error:', error);
        showToast(isAr ? '&#9888;&#65039; استخدام نظام ذكي محسّن للمحتوى' : '&#9888;&#65039; Using optimized smart content system', true);
        return generateSmartFallback(title, desc, count - 2, isAr);
    }
}

async function tryFreeAIApis(prompt, isAr) {
    try {
        var response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: prompt }],
                model: 'openai',
                seed: Math.floor(Math.random() * 1000)
            })
        });

        if (response.ok) {
            var text = await response.text();
            var slides = extractJSONFromText(text);
            if (slides && slides.length > 0) return slides;
        }
    } catch(e) { console.log('Pollinations API failed:', e); }

    return null;
}

function extractJSONFromText(text) {
    if (!text) return null;
    var jsonMatch = text.match(/\{[\s\S]*"slides"[\s\S]*\}/);
    if (jsonMatch) {
        try {
            var data = JSON.parse(jsonMatch[0]);
            if (data.slides && data.slides.length > 0) {
                return data.slides.map(function(s) {
                    return {
                        title: s.title || (currentLang === 'ar' ? 'شريحة' : 'Slide'),
                        points: Array.isArray(s.points) ? s.points.slice(0, 3) : [currentLang === 'ar' ? 'نقطة 1' : 'Point 1', currentLang === 'ar' ? 'نقطة 2' : 'Point 2', currentLang === 'ar' ? 'نقطة 3' : 'Point 3']
                    };
                });
            }
        } catch(e) {}
    }
    try {
        var data = JSON.parse(text);
        if (data.slides && data.slides.length > 0) return data.slides;
    } catch(e) {}
    return parseTextToSlides(text);
}

function parseTextToSlides(text) {
    var slides = [];
    var lines = text.split('
').filter(function(l) { return l.trim(); });
    var currentSlide = null;

    lines.forEach(function(line) {
        line = line.trim();
        if (/^(\d+[\.\-]|###|\*\*|#)\s*/.test(line) && !line.startsWith('&#8226;') && !line.startsWith('-')) {
            if (currentSlide && currentSlide.points.length > 0) slides.push(currentSlide);
            var title = line.replace(/^(\d+[\.\-]|###|\*\*|#)\s*/, '').trim();
            currentSlide = { title: title, points: [] };
        }
        else if ((line.startsWith('&#8226;') || line.startsWith('-') || /^\d+\./.test(line)) && currentSlide) {
            var point = line.replace(/^[&#8226;\-\d+\.\s]*/, '').trim();
            if (point && currentSlide.points.length < 3) currentSlide.points.push(point);
        }
    });

    if (currentSlide && currentSlide.points.length > 0) slides.push(currentSlide);
    return slides.length > 0 ? slides : null;
}

function generateSmartFallback(title, desc, count, isAr) {
    var lower = (title + ' ' + (desc || '')).toLowerCase();

    var templatesAr = {
        marketing: [
            { title: 'نظرة عامة على السوق', points: ['تحليل الوضع الحالي للسوق المستهدف وفرص النمو المتاحة', 'تحديد التحديات الرئيسية التي تواجه القطاع والحلول المقترحة', 'رسم خارطة طريق استراتيجية للوصول إلى الجمهور المستهدف'] },
            { title: 'الجمهور المستهدف', points: ['تحليل الشرائح السكانية والسلوكية للجمهور المستهدف', 'فهم احتياجات الجمهور ونقاط الألم التي يعاني منها', 'بناء شخصيات المشترين المثالية لضمان استهداف دقيق'] },
            { title: 'استراتيجية التسويق', points: ['تحديد القنوات التسويقية الأمثل للوصول إلى الجمهور', 'صياغة الرسالة التسويقية الأساسية التي تميز العلامة', 'بناء هوية العلامة التجارية بشكل متماسك وقوي'] },
            { title: 'خطة المحتوى', points: ['تصميم أنواع المحتوى المتنوعة المناسبة لكل قناة', 'جدولة النشر الاستراتيجية على المنصات المختلفة', 'استراتيجيات جذب الانتباه وزيادة التفاعل مع الجمهور'] },
            { title: 'الميزانية والموارد', points: ['توزيع الميزانية بشكل ذكي على القنوات المختلفة', 'تقدير تكاليف الإنتاج والإعلان بدقة عالية', 'حساب العائد المتوقع على الاستثمار ROI'] },
            { title: 'مؤشرات الأداء', points: ['تحديد مؤشرات KPIs الرئيسية لقياس نجاح الحملة', 'اختيار أدوات القياس والتحليل المناسبة', 'وضع جدول مراجعة دوري لتقييم الأداء'] },
            { title: 'الجدول الزمني', points: ['المرحلة الأولى: التحضير والإطلاق', 'المرحلة الثانية: التنفيذ والمتابعة', 'المرحلة الثالثة: التقييم والتحسين'] },
            { title: 'الخلاصة والتوصيات', points: ['ملخص النقاط الرئيسية للخطة', 'الخطوات التنفيذية الفورية', 'التوصيات للمراحل القادمة'] }
        ],
        education: [
            { title: 'مقدمة في الموضوع', points: ['تعريف شامل للموضوع وأهميته في المجال التعليمي', 'الأهداف التعليمية المرتقبة من دراسة هذا الموضوع', 'خريطة المحتوى التعليمي والمنهج المتبع'] },
            { title: 'الأساسيات النظرية', points: ['المفاهيم الأساسية والمصطلحات المهمة في المجال', 'الإطار النظري الذي يدعم الموضوع والدراسات السابقة', 'النماذج والأطر المستخدمة في التحليل والتطبيق'] },
            { title: 'المنهجية والأدوات', points: ['المنهج العلمي المستخدم في الدراسة والتعليم', 'أدوات التقييم والقياس المناسبة للموضوع', 'استراتيجيات التعلم الفعال والتفاعلي'] },
            { title: 'التطبيق العملي', points: ['أمثلة عملية واقعية من الحياة العملية', 'حالات دراسية ناجحة يمكن الاستفادة منها', 'تمارين تطبيقية لتعميق الفهم والمهارات'] },
            { title: 'التقييم والمتابعة', points: ['معايير تقييم الأداء والفهم بشكل عادل وشامل', 'أدوات قياس مدى تحقيق الأهداف التعليمية', 'آليات التحسين المستمر بناءً على النتائج'] },
            { title: 'الموارد والمراجع', points: ['المصادر التعليمية الأساسية والموثوقة', 'المراجع العلمية والأكاديمية المعتمدة', 'المواد والأدوات المساعدة للتعلم الذاتي'] },
            { title: 'التحديات والحلول', points: ['العقبات المتوقعة في التطبيق', 'استراتيجيات التغلب على الصعوبات', 'بدائل وخيارات احتياطية'] },
            { title: 'الخلاصة والخطوات القادمة', points: ['ملخص أهم النقاط المكتسبة', 'التوصيات للممارسين', 'خطة التطوير المستقبلية'] }
        ],
        business: [
            { title: 'الرؤية والرسالة', points: ['رؤية الشركة الطموحة والملهمة للمستقبل', 'الرسالة الأساسية التي توجه جميع الأنشطة', 'القيم المؤسسية التي تحكم سلوك الفريق'] },
            { title: 'تحليل السوق', points: ['حجم السوق الحالي ونسبة النمو المتوقعة', 'تحليل المنافسين الرئيسيين ونقاط القوة والضعف', 'الاتجاهات المستقبلية والفرص الناشئة في القطاع'] },
            { title: 'نموذج العمل', points: ['مصادر الدخل الرئيسية والثانوية للشركة', 'شرائح العملاء المستهدفة وخصائص كل شريحة', 'قنوات الوصول والتوزيع الفعالة للمنتجات'] },
            { title: 'المنتجات والخدمات', points: ['وصف تفصيلي لمحفظة المنتجات والخدمات', 'المميزات التنافسية التي تميزنا عن المنافسين', 'خارطة طريق تطوير المنتجات المستقبلية'] },
            { title: 'الفريق والتنظيم', points: ['الهيكل التنظيمي الفعال للشركة', 'الكوادر الرئيسية وخبراتهم ومهاراتهم', 'ثقافة العمل الإيجابية والبيئة المؤسسية المحفزة'] },
            { title: 'الخطة المالية', points: ['التوقعات المالية الواقعية للسنوات القادمة', 'التمويل المطلوب ومصادره المتاحة', 'نقطة التعادل والربحية المتوقعة'] },
            { title: 'استراتيجية التسويق', points: ['خطة التسويق والترويج', 'الميزانية التسويقية المخصصة', 'مؤشرات قياس نجاح التسويق'] },
            { title: 'الخطة التنفيذية', points: ['المراحل الرئيسية للتنفيذ', 'الجدول الزمني التفصيلي', 'إدارة المخاطر والحلول البديلة'] }
        ],
        tech: [
            { title: 'نظرة عامة على التقنية', points: ['تعريف شامل للتقنية وتطورها عبر الزمن', 'الحالة الحالية للتقنية والتطبيقات الرائدة', 'أهمية التقنية في تشكيل مستقبل الصناعة'] },
            { title: 'المكونات والبنية', points: ['العتاد والأجهزة المستخدمة في التقنية', 'البرمجيات والأنظمة الأساسية الداعمة', 'البنية التحتية والشبكات المطلوبة'] },
            { title: 'حالات الاستخدام', points: ['التطبيقات العملية في مختلف القطاعات والصناعات', 'حالات نجاح ملموسة يمكن الاستفادة منها', 'التحديات والمعوقات التي تواجه التطبيق'] },
            { title: 'المقارنة والتحليل', points: ['مقارنة مع التقنيات السابقة والبدائل المتاحة', 'المميزات والإيجابيات الفريدة للتقنية', 'العيوب والقيود التي يجب مراعاتها'] },
            { title: 'التكامل والأمان', points: ['التكامل السلس مع الأنظمة الحالية', 'بروتوكولات الأمان وحماية البيانات', 'معايير التوافق والتشغيل المتبعة'] },
            { title: 'المستقبل والاتجاهات', points: ['الاتجاهات التقنية القادمة والمتوقعة', 'التطورات المستقبلية التي ستغير القواعد', 'الفرص والتحديات التي تنتظرنا'] }
        ],
        medical: [
            { title: 'المقدمة والنظرة العامة', points: ['تعريف شامل للموضوع الصحي وأهميته', 'الأهداف الرئيسية من دراسة هذا الموضوع', 'نطاق المشكلة وحجم التأثير على المجتمع'] },
            { title: 'التشخيص والأعراض', points: ['الأعراض الرئيسية والعلامات التحذيرية', 'الفحوصات والاختبارات التشخيصية المطلوبة', 'التصنيف الطبي والتقسيم العلمي للحالات'] },
            { title: 'خيارات العلاج', points: ['العلاجات المتاحة حالياً ومستويات فعاليتها', 'البروتوكولات العلاجية المعتمدة دولياً', 'النتائج المتوقعة والآثار الجانبية المحتملة'] },
            { title: 'الوقاية والحماية', points: ['الإجراءات الوقائية الأساسية والفعالة', 'نمط الحياة الصحي والعادات الإيجابية', 'الفحوصات الدورية وأهمية المتابعة المستمرة'] },
            { title: 'الأبحاث والتطورات', points: ['أحدث الدراسات العلمية والاكتشافات', 'التجارب السريرية الجارية والنتائج الأولية', 'التكنولوجيا الطبية الحديثة والابتكارات'] },
            { title: 'التوصيات والخلاصة', points: ['توصيات عملية للممارسين الصحيين', 'نصائح هامة للمرضى والمجتمع', 'خطة العمل والخطوات القادمة للتحسين'] }
        ],
        finance: [
            { title: 'الملخص التنفيذي', points: ['نظرة شاملة على الأداء المالي للفترة', 'الإنجازات الرئيسية والأرقام المهمة', 'أبرز التحديات التي واجهتنا والحلول'] },
            { title: 'تحليل الإيرادات', points: ['مصادر الدخل الرئيسية والمساهمة النسبية', 'معدلات النمو المحققة والمتوقعة', 'التوقعات المستقبلية للإيرادات'] },
            { title: 'تحليل المصروفات', points: ['التكاليف التشغيلية الأساسية والمتغيرة', 'الاستثمارات الرأسمالية المهمة', 'مجالات التحسين والتوفير الممكنة'] },
            { title: 'تحليل الأرباح', points: ['صافي الربح مع التحليل التفصيلي', 'هوامش الربح والمقارنة مع المعايير', 'المقارنة السنوية واتجاهات الأداء'] },
            { title: 'التدفق النقدي', points: ['التدفقات النقدية الداخلة والخارجة', 'إدارة السيولة والرصيد النقدي', 'التوقعات المستقبلية للتدفق النقدي'] },
            { title: 'التوصيات والخطة القادمة', points: ['استراتيجيات تحسين الأداء المالي', 'الفرص الاستثمارية الواعدة المتاحة', 'خطة العمل المالية للفترة القادمة'] }
        ]
    };

    var templatesEn = {
        marketing: [
            { title: 'Market Overview', points: ['Analyze current market conditions and available growth opportunities', 'Identify key challenges facing the sector and proposed solutions', 'Draw a strategic roadmap to reach the target audience'] },
            { title: 'Target Audience', points: ['Analyze demographic and behavioral segments of the target audience', 'Understand audience needs and pain points', 'Build ideal buyer personas for precise targeting'] },
            { title: 'Marketing Strategy', points: ['Identify optimal marketing channels to reach the audience', 'Craft the core marketing message that differentiates the brand', 'Build a cohesive and strong brand identity'] },
            { title: 'Content Plan', points: ['Design diverse content types suitable for each channel', 'Strategic publishing schedule across different platforms', 'Attention-grabbing strategies to increase audience engagement'] },
            { title: 'Budget & Resources', points: ['Smartly distribute budget across different channels', 'Accurately estimate production and advertising costs', 'Calculate expected return on investment ROI'] },
            { title: 'Performance Metrics', points: ['Define key KPIs to measure campaign success', 'Choose appropriate measurement and analytics tools', 'Set up periodic review schedule to evaluate performance'] },
            { title: 'Timeline', points: ['Phase 1: Preparation and Launch', 'Phase 2: Execution and Monitoring', 'Phase 3: Evaluation and Optimization'] },
            { title: 'Summary & Recommendations', points: ['Summary of key plan points', 'Immediate implementation steps', 'Recommendations for upcoming phases'] }
        ],
        education: [
            { title: 'Introduction to the Topic', points: ['Comprehensive definition of the topic and its importance in education', 'Expected learning objectives from studying this topic', 'Educational content map and curriculum followed'] },
            { title: 'Theoretical Foundations', points: ['Basic concepts and important terminology in the field', 'Theoretical framework supporting the topic and previous studies', 'Models and frameworks used for analysis and application'] },
            { title: 'Methodology & Tools', points: ['Scientific methodology used in study and education', 'Appropriate evaluation and measurement tools for the topic', 'Effective and interactive learning strategies'] },
            { title: 'Practical Application', points: ['Real practical examples from working life', 'Successful case studies to learn from', 'Practical exercises to deepen understanding and skills'] },
            { title: 'Assessment & Monitoring', points: ['Fair and comprehensive criteria for evaluating performance and understanding', 'Tools to measure achievement of educational objectives', 'Continuous improvement mechanisms based on results'] },
            { title: 'Resources & References', points: ['Essential and reliable educational sources', 'Scientific and academic accredited references', 'Materials and tools for self-learning'] },
            { title: 'Challenges & Solutions', points: ['Expected obstacles in implementation', 'Strategies to overcome difficulties', 'Alternative and backup options'] },
            { title: 'Summary & Next Steps', points: ['Summary of key acquired points', 'Recommendations for practitioners', 'Future development plan'] }
        ],
        business: [
            { title: 'Vision & Mission', points: ['Company ambitious and inspiring vision for the future', 'Core mission guiding all activities', 'Organizational values governing team behavior'] },
            { title: 'Market Analysis', points: ['Current market size and expected growth rate', 'Analysis of key competitors and their strengths and weaknesses', 'Future trends and emerging opportunities in the sector'] },
            { title: 'Business Model', points: ['Primary and secondary revenue sources for the company', 'Targeted customer segments and characteristics of each', 'Effective access and distribution channels for products'] },
            { title: 'Products & Services', points: ['Detailed description of product and service portfolio', 'Competitive advantages that differentiate us from competitors', 'Future product development roadmap'] },
            { title: 'Team & Organization', points: ['Effective organizational structure of the company', 'Key personnel and their experiences and skills', 'Positive work culture and motivating organizational environment'] },
            { title: 'Financial Plan', points: ['Realistic financial projections for coming years', 'Required funding and available sources', 'Break-even point and expected profitability'] },
            { title: 'Marketing Strategy', points: ['Marketing and promotion plan', 'Allocated marketing budget', 'Metrics to measure marketing success'] },
            { title: 'Implementation Plan', points: ['Key implementation phases', 'Detailed timeline', 'Risk management and alternative solutions'] }
        ],
        tech: [
            { title: 'Technology Overview', points: ['Comprehensive definition of the technology and its evolution over time', 'Current state of the technology and leading applications', 'Importance of the technology in shaping the industry future'] },
            { title: 'Components & Architecture', points: ['Hardware and devices used in the technology', 'Essential supporting software and systems', 'Required infrastructure and networks'] },
            { title: 'Use Cases', points: ['Practical applications across various sectors and industries', 'Tangible success stories to learn from', 'Challenges and obstacles facing implementation'] },
            { title: 'Comparison & Analysis', points: ['Comparison with previous technologies and available alternatives', 'Unique advantages and positives of the technology', 'Disadvantages and limitations to consider'] },
            { title: 'Integration & Security', points: ['Seamless integration with existing systems', 'Security protocols and data protection', 'Compatibility and interoperability standards'] },
            { title: 'Future & Trends', points: ['Upcoming and expected technology trends', 'Future developments that will change the rules', 'Opportunities and challenges ahead'] }
        ],
        medical: [
            { title: 'Introduction & Overview', points: ['Comprehensive definition of the health topic and its importance', 'Main objectives of studying this topic', 'Scope of the problem and impact on society'] },
            { title: 'Diagnosis & Symptoms', points: ['Main symptoms and warning signs', 'Required diagnostic tests and examinations', 'Medical classification and scientific categorization of cases'] },
            { title: 'Treatment Options', points: ['Currently available treatments and their effectiveness levels', 'Internationally approved treatment protocols', 'Expected outcomes and potential side effects'] },
            { title: 'Prevention & Protection', points: ['Essential and effective preventive measures', 'Healthy lifestyle and positive habits', 'Periodic check-ups and importance of continuous monitoring'] },
            { title: 'Research & Developments', points: ['Latest scientific studies and discoveries', 'Ongoing clinical trials and preliminary results', 'Modern medical technology and innovations'] },
            { title: 'Recommendations & Summary', points: ['Practical recommendations for healthcare practitioners', 'Important advice for patients and society', 'Action plan and next steps for improvement'] }
        ],
        finance: [
            { title: 'Executive Summary', points: ['Comprehensive overview of period financial performance', 'Key achievements and important numbers', 'Major challenges faced and solutions'] },
            { title: 'Revenue Analysis', points: ['Primary revenue sources and relative contribution', 'Achieved and expected growth rates', 'Future revenue projections'] },
            { title: 'Expense Analysis', points: ['Basic and variable operating costs', 'Important capital investments', 'Possible improvement and savings areas'] },
            { title: 'Profit Analysis', points: ['Net profit with detailed analysis', 'Profit margins and comparison with benchmarks', 'Year-over-year comparison and performance trends'] },
            { title: 'Cash Flow', points: ['Incoming and outgoing cash flows', 'Liquidity management and cash balance', 'Future cash flow projections'] },
            { title: 'Recommendations & Next Plan', points: ['Strategies to improve financial performance', 'Promising investment opportunities available', 'Financial action plan for the next period'] }
        ]
    };

    var templates = isAr ? templatesAr : templatesEn;
    var type = 'general';
    if (lower.indexOf('marketing') !== -1 || lower.indexOf('تسويق') !== -1 || lower.indexOf('إعلان') !== -1) type = 'marketing';
    else if (lower.indexOf('education') !== -1 || lower.indexOf('تعليم') !== -1 || lower.indexOf('تدريب') !== -1 || lower.indexOf('مهارة') !== -1) type = 'education';
    else if (lower.indexOf('business') !== -1 || lower.indexOf('أعمال') !== -1 || lower.indexOf('شركة') !== -1 || lower.indexOf('مشروع') !== -1) type = 'business';
    else if (lower.indexOf('tech') !== -1 || lower.indexOf('تقن') !== -1 || lower.indexOf('برمج') !== -1 || lower.indexOf('ذكاء') !== -1 || lower.indexOf('ai') !== -1) type = 'tech';
    else if (lower.indexOf('health') !== -1 || lower.indexOf('صح') !== -1 || lower.indexOf('medical') !== -1 || lower.indexOf('طب') !== -1 || lower.indexOf('نفس') !== -1) type = 'medical';
    else if (lower.indexOf('finance') !== -1 || lower.indexOf('مال') !== -1 || lower.indexOf('ميزانية') !== -1 || lower.indexOf('invest') !== -1 || lower.indexOf('استثمار') !== -1) type = 'finance';

    var content = templates[type] || templates.business;

    if (count <= content.length) {
        return content.slice(0, count);
    }

    var result = content.slice();
    var extra = count - content.length;
    for (var i = 0; i < extra; i++) {
        result.push({
            title: isAr ? 'نقطة إضافية ' + (i + 1) : 'Additional Point ' + (i + 1),
            points: isAr ? [
                'تحليل تفصيلي للجانب ' + (i + 1) + ' من الموضوع',
                'أمثلة عملية ودراسات حالة مرتبطة',
                'استنتاجات وتوصيات عملية قابلة للتطبيق'
            ] : [
                'Detailed analysis of aspect ' + (i + 1) + ' of the topic',
                'Practical examples and related case studies',
                'Conclusions and actionable recommendations'
            ]
        });
    }
    return result;
}

// ===== GENERATE PRESENTATION =====
async function generatePresentation() {
    var title = document.getElementById('presTitle').value.trim();
    var desc = document.getElementById('presDesc').value.trim();
    var isAr = currentLang === 'ar';

    if (!title) {
        showToast(isAr ? '❌ يرجى إدخال عنوان العرض' : '❌ Please enter a presentation title', true);
        document.getElementById('presTitle').focus();
        return;
    }

    var btn = document.getElementById('generateBtn');
    var btnText = btn.querySelector('.btn-text');
    var btnLoad = btn.querySelector('.btn-loading');

    btnText.style.display = 'none';
    btnLoad.style.display = 'flex';
    btn.disabled = true;

    try {
        var category = getTopicCategory(title);
        var aiSlides = await generateAIContent(title, desc, selectedCount);

        var theme = THEMES[selectedTheme];
        var slides = [];

        // Title slide
        slides.push({
            type: 'title',
            title: title,
            subtitle: desc || (isAr ? 'عرض تقديمي احترافي' : 'Professional Presentation'),
            bg: 'linear-gradient(135deg, #' + theme.bg1 + ', #' + theme.bg2 + ')',
            textColor: '#' + theme.text,
            accent: '#' + theme.bg1,
            image: getSlideImage(category, 0)
        });

        // Content slides
        aiSlides.forEach(function(slide, i) {
            var layouts = ['standard', 'image', 'stats', 'chart', 'timeline'];
            var layout = layouts[i % layouts.length];

            slides.push({
                type: 'content',
                layout: layout,
                title: slide.title,
                points: slide.points,
                bg: i % 2 === 0 ? '#ffffff' : '#f8f9fa',
                textColor: '#1a1a2e',
                accent: '#' + theme.bg1,
                image: getSlideImage(category, i + 1)
            });
        });

        // End slide
        slides.push({
            type: 'end',
            title: isAr ? 'شكراً لكم' : 'Thank You',
            subtitle: isAr ? 'هل لديك أي أسئلة؟' : 'Do you have any questions?',
            bg: 'linear-gradient(135deg, #' + theme.bg1 + ', #' + theme.bg2 + ')',
            textColor: '#' + theme.text,
            accent: '#' + theme.bg1,
            image: getSlideImage(category, selectedCount - 1)
        });

        var pres = {
            id: Date.now(),
            title: title,
            desc: desc,
            theme: selectedTheme,
            slideCount: slides.length,
            slides: slides,
            aiGenerated: true,
            language: currentLang,
            category: category,
            createdAt: new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US'),
            createdTime: new Date().toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })
        };

        presentations.unshift(pres);
        try {
            localStorage.setItem('presentations', JSON.stringify(presentations));
        } catch(e) {}

        updateLibCount();

        document.getElementById('presTitle').value = '';
        document.getElementById('presDesc').value = '';

        showToast(isAr ? '✅ تم إنشاء العرض بنجاح!' : '✅ Presentation created successfully!');
        openViewer(pres);

    } catch(error) {
        console.error(error);
        showToast((isAr ? '❌ حدث خطأ: ' : '❌ Error: ') + error.message, true);
    } finally {
        btnText.style.display = 'flex';
        btnLoad.style.display = 'none';
        btn.disabled = false;
    }
}

// ===== VIEWER =====
function openViewer(pres) {
    currentPres = pres;
    currentSlide = 0;
    document.getElementById('viewerPresTitle').textContent = pres.title;
    renderSlideLayers();
    renderThumbnails();
    updateSlideIndicator();
    goToSlide(0);
    navigateTo('viewer');
}

function renderSlideLayers() {
    var frame = document.getElementById('slideFrame');
    frame.innerHTML = '';

    var slideIcons = ['&#127919;', '&#128202;', '&#128161;', '&#128640;', '&#9889;', '&#128293;', '&#11088;', '&#128142;', '&#127775;', '&#10024;', '&#127912;', '&#128302;'];
    var statNumbers = ['85%', '3.2x', '+150%', '92%', '4.8/5', '2.5M', '98%', '67%'];
    var statLabels = currentLang === 'ar' 
        ? ['معدل النجاح', 'نمو الإيرادات', 'زيادة المبيعات', 'رضا العملاء', 'التقييم', 'عدد المستخدمين', 'الكفاءة', 'التوصيات']
        : ['Success Rate', 'Revenue Growth', 'Sales Increase', 'Customer Satisfaction', 'Rating', 'Users', 'Efficiency', 'Recommendations'];
    var chartLabels = currentLang === 'ar' 
        ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    var chartData = [65, 78, 90, 81, 96, 105];
    var isAr = currentLang === 'ar';

    currentPres.slides.forEach(function(slide, i) {
        var layer = document.createElement('div');
        layer.className = 'slide-layer' + (i === 0 ? ' active' : '');
        layer.dataset.index = i;
        layer.style.background = slide.bg;
        layer.style.color = slide.textColor;
        layer.style.setProperty('--slide-accent', slide.accent);

        var html = '';
        var icon = slideIcons[i % slideIcons.length];

        if (slide.type === 'title') {
            html = '<div class="sl-pattern-grid"></div>' +
                   '<div class="sl-deco-circle sl-deco-circle-1"></div>' +
                   '<div class="sl-deco-circle sl-deco-circle-2"></div>' +
                   '<div class="sl-deco-circle sl-deco-circle-3"></div>' +
                   '<div class="sl-title-wrap">' +
                   '<span class="sl-title-icon">' + icon + '</span>' +
                   '<h2 class="sl-title-h2">' + escapeHtml(slide.title) + '</h2>' +
                   '<p class="sl-subtitle">' + escapeHtml(slide.subtitle) + '</p>' +
                   '</div>' +
                   '<div class="sl-num">' + (i + 1) + ' / ' + currentPres.slides.length + '</div>';

        } else if (slide.type === 'content') {
            var layout = slide.layout || 'standard';

            if (layout === 'standard') {
                html = '<div class="sl-pattern-dots"></div>' +
                       '<div class="sl-content-standard">' +
                       '<div class="sl-content-header">' +
                       '<div class="sl-content-icon" style="background: ' + slide.accent + '">' + icon + '</div>' +
                       '<h3 class="sl-content-h3" style="color: ' + slide.accent + '">' + escapeHtml(slide.title) + '</h3>' +
                       '</div>' +
                       '<div class="sl-accent-line" style="background: ' + slide.accent + '"></div>' +
                       '<ul class="sl-list">' +
                       slide.points.map(function(p) {
                           return '<li style="border-right-color: ' + slide.accent + '">' +
                                  '<span class="sl-bullet" style="background: ' + slide.accent + '"></span>' +
                                  escapeHtml(p) + '</li>';
                       }).join('') +
                       '</ul>' +
                       '</div>' +
                       '<div class="sl-num">' + (i + 1) + ' / ' + currentPres.slides.length + '</div>';

            } else if (layout === 'image') {
                html = '<div class="sl-content-image">' +
                       '<div class="sl-img-side">' +
                       '<img src="' + slide.image + '" alt="' + escapeHtml(slide.title) + '" onerror="this.style.display='none'">' +
                       '<div class="sl-img-overlay"></div>' +
                       '</div>' +
                       '<div class="sl-text-side">' +
                       '<div class="sl-content-header" style="margin-bottom: 20px;">' +
                       '<div class="sl-content-icon" style="background: ' + slide.accent + '">' + icon + '</div>' +
                       '<h3 class="sl-content-h3" style="color: ' + slide.accent + '">' + escapeHtml(slide.title) + '</h3>' +
                       '</div>' +
                       '<div class="sl-accent-line" style="background: ' + slide.accent + '"></div>' +
                       '<ul class="sl-list">' +
                       slide.points.map(function(p) {
                           return '<li style="border-right-color: ' + slide.accent + '">' +
                                  '<span class="sl-bullet" style="background: ' + slide.accent + '"></span>' +
                                  escapeHtml(p) + '</li>';
                       }).join('') +
                       '</ul>' +
                       '</div>' +
                       '</div>' +
                       '<div class="sl-num">' + (i + 1) + ' / ' + currentPres.slides.length + '</div>';

            } else if (layout === 'stats') {
                html = '<div class="sl-pattern-dots"></div>' +
                       '<div class="sl-content-stats">' +
                       '<div class="sl-content-header" style="margin-bottom: 10px;">' +
                       '<div class="sl-content-icon" style="background: ' + slide.accent + '">' + icon + '</div>' +
                       '<h3 class="sl-content-h3" style="color: ' + slide.accent + '">' + escapeHtml(slide.title) + '</h3>' +
                       '</div>' +
                       '<div class="sl-accent-line" style="background: ' + slide.accent + '"></div>' +
                       '<ul class="sl-list" style="margin-bottom: 20px;">' +
                       slide.points.slice(0, 1).map(function(p) {
                           return '<li style="border-right-color: ' + slide.accent + '">' +
                                  '<span class="sl-bullet" style="background: ' + slide.accent + '"></span>' +
                                  escapeHtml(p) + '</li>';
                       }).join('') +
                       '</ul>' +
                       '<div class="sl-stats-grid">' +
                       [0, 1, 2].map(function(si) {
                           return '<div class="sl-stat-card" style="border-top-color: ' + slide.accent + '">' +
                                  '<div class="sl-stat-number" style="color: ' + slide.accent + '">' + statNumbers[(i + si) % statNumbers.length] + '</div>' +
                                  '<div class="sl-stat-label">' + statLabels[(i + si) % statLabels.length] + '</div>' +
                                  '</div>';
                       }).join('') +
                       '</div>' +
                       '</div>' +
                       '<div class="sl-num">' + (i + 1) + ' / ' + currentPres.slides.length + '</div>';

            } else if (layout === 'chart') {
                html = '<div class="sl-pattern-dots"></div>' +
                       '<div class="sl-content-chart">' +
                       '<div class="sl-col-left">' +
                       '<div class="sl-content-header" style="margin-bottom: 20px;">' +
                       '<div class="sl-content-icon" style="background: ' + slide.accent + '">' + icon + '</div>' +
                       '<h3 class="sl-content-h3" style="color: ' + slide.accent + '">' + escapeHtml(slide.title) + '</h3>' +
                       '</div>' +
                       '<div class="sl-accent-line" style="background: ' + slide.accent + '"></div>' +
                       '<ul class="sl-list">' +
                       slide.points.map(function(p) {
                           return '<li style="border-right-color: ' + slide.accent + '">' +
                                  '<span class="sl-bullet" style="background: ' + slide.accent + '"></span>' +
                                  escapeHtml(p) + '</li>';
                       }).join('') +
                       '</ul>' +
                       '</div>' +
                       '<div class="sl-col-right">' +
                       '<div class="sl-chart-container">' +
                       '<canvas id="chart-' + i + '" width="350" height="250"></canvas>' +
                       '</div>' +
                       '</div>' +
                       '</div>' +
                       '<div class="sl-num">' + (i + 1) + ' / ' + currentPres.slides.length + '</div>';

            } else {
                html = '<div class="sl-pattern-dots"></div>' +
                       '<div class="sl-content-timeline">' +
                       '<div class="sl-content-header" style="margin-bottom: 10px;">' +
                       '<div class="sl-content-icon" style="background: ' + slide.accent + '">' + icon + '</div>' +
                       '<h3 class="sl-content-h3" style="color: ' + slide.accent + '">' + escapeHtml(slide.title) + '</h3>' +
                       '</div>' +
                       '<div class="sl-accent-line" style="background: ' + slide.accent + '"></div>' +
                       '<div class="sl-timeline">' +
                       slide.points.map(function(p, pi) {
                           return '<div class="sl-timeline-item">' +
                                  '<div class="sl-timeline-dot" style="background: ' + slide.accent + '">' + (pi + 1) + '</div>' +
                                  '<div class="sl-timeline-text">' + escapeHtml(p) + '</div>' +
                                  '</div>';
                       }).join('') +
                       '</div>' +
                       '</div>' +
                       '<div class="sl-num">' + (i + 1) + ' / ' + currentPres.slides.length + '</div>';
            }

        } else {
            html = '<div class="sl-pattern-grid"></div>' +
                   '<div class="sl-deco-circle sl-deco-circle-1"></div>' +
                   '<div class="sl-deco-circle sl-deco-circle-2"></div>' +
                   '<div class="sl-end-wrap">' +
                   '<span class="sl-end-icon">&#128591;</span>' +
                   '<h2 class="sl-end-h2">' + escapeHtml(slide.title) + '</h2>' +
                   '<p class="sl-end-sub">' + escapeHtml(slide.subtitle) + '</p>' +
                   '</div>' +
                   '<div class="sl-num">' + (i + 1) + ' / ' + currentPres.slides.length + '</div>';
        }

        layer.innerHTML = html;
        frame.appendChild(layer);

        var canvas = layer.querySelector('canvas[id^="chart-"]');
        if (canvas) {
            setTimeout(function() {
                try {
                    new Chart(canvas, {
                        type: 'bar',
                        data: {
                            labels: chartLabels,
                            datasets: [{
                                label: isAr ? 'الأداء' : 'Performance',
                                data: chartData.map(function(d) { return d + Math.floor(Math.random() * 30 - 15); }),
                                backgroundColor: slide.accent + '88',
                                borderColor: slide.accent,
                                borderWidth: 2,
                                borderRadius: 8
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                                x: { grid: { display: false } }
                            }
                        }
                    });
                } catch(e) { console.log('Chart error:', e); }
            }, 100);
        }
    });
}

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderThumbnails() {
    var scroll = document.getElementById('thumbsScroll');
    scroll.innerHTML = '';

    currentPres.slides.forEach(function(slide, i) {
        var thumb = document.createElement('div');
        thumb.className = 'thumb-item' + (i === 0 ? ' active' : '');
        if (slide.image) {
            thumb.style.backgroundImage = 'url(' + slide.image + ')';
        } else {
            thumb.style.background = slide.bg;
        }
        thumb.onclick = function() { goToSlide(i); };
        thumb.innerHTML = '<span class="thumb-num">' + (i + 1) + '</span>';
        scroll.appendChild(thumb);
    });
}

function goToSlide(index) {
    if (index < 0 || index >= currentPres.slides.length) return;
    document.querySelectorAll('.slide-layer').forEach(function(el, i) {
        el.classList.toggle('active', i === index);
    });
    document.querySelectorAll('.thumb-item').forEach(function(el, i) {
        el.classList.toggle('active', i === index);
    });
    currentSlide = index;
    updateSlideIndicator();
}

function nextSlide() { goToSlide(currentSlide + 1); }
function prevSlide() { goToSlide(currentSlide - 1); }

function updateSlideIndicator() {
    document.getElementById('slideIndicator').textContent = 
        (currentSlide + 1) + ' / ' + currentPres.slides.length;
}

function toggleFullscreen() {
    var viewer = document.getElementById('viewer-section');
    if (!document.fullscreenElement) {
        viewer.requestFullscreen().catch(function() {});
    } else {
        document.exitFullscreen();
    }
}

// ===== DOWNLOAD =====
function downloadPPTX() {
    if (!currentPres) {
        showToast(currentLang === 'ar' ? '❌ لا يوجد عرض للتحميل' : '❌ No presentation to download', true);
        return;
    }

    showToast(currentLang === 'ar' ? '⏳ جاري إنشاء ملف HTML...' : '⏳ Creating HTML file...');

    setTimeout(function() {
        try {
            var htmlContent = generateHTMLSlides();
            var blob = new Blob([htmlContent], { type: 'text/html' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = currentPres.title + '.html';
            a.click();
            URL.revokeObjectURL(url);
            showToast(currentLang === 'ar' ? '✅ تم التحميل!' : '✅ Downloaded!');
        } catch(e) {
            console.error(e);
            showToast(currentLang === 'ar' ? '❌ حدث خطأ في التحميل' : '❌ Download error', true);
        }
    }, 500);
}

function generateHTMLSlides() {
    var theme = THEMES[currentPres.theme];
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + escapeHtml(currentPres.title) + '</title>';
    html += '<style>body{font-family:Arial,sans-serif;margin:0;padding:20px;background:#f0f0f0;}';
    html += '.slide{width:960px;height:540px;margin:20px auto;background:white;box-shadow:0 4px 20px rgba(0,0,0,0.1);padding:40px;box-sizing:border-box;page-break-after:always;}';
    html += '.title-slide{background:linear-gradient(135deg,#' + theme.bg1 + ',#' + theme.bg2 + ');color:white;text-align:center;display:flex;flex-direction:column;justify-content:center;}';
    html += '.end-slide{background:linear-gradient(135deg,#' + theme.bg1 + ',#' + theme.bg2 + ');color:white;text-align:center;display:flex;flex-direction:column;justify-content:center;}';
    html += 'h1{font-size:2.5rem;margin-bottom:1rem;}h2{font-size:2rem;color:#' + theme.bg1 + ';margin-bottom:1rem;}ul{list-style:none;padding:0;}li{padding:8px 0;font-size:1.1rem;}';
    html += '.stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:20px;}';
    html += '.stat-card{background:#f8f9fa;padding:20px;border-radius:10px;text-align:center;border-top:4px solid #' + theme.bg1 + ';}';
    html += '.stat-num{font-size:2rem;font-weight:bold;color:#' + theme.bg1 + ';}';
    html += '</style></head><body>';

    currentPres.slides.forEach(function(slide) {
        if (slide.type === 'title') {
            html += '<div class="slide title-slide"><h1>' + escapeHtml(slide.title) + '</h1><p>' + escapeHtml(slide.subtitle) + '</p></div>';
        } else if (slide.type === 'content') {
            html += '<div class="slide"><h2>' + escapeHtml(slide.title) + '</h2><ul>';
            slide.points.forEach(function(p) {
                html += '<li>&#8226; ' + escapeHtml(p) + '</li>';
            });
            html += '</ul></div>';
        } else {
            html += '<div class="slide end-slide"><h1>' + escapeHtml(slide.title) + '</h1><p>' + escapeHtml(slide.subtitle) + '</p></div>';
        }
    });

    html += '</body></html>';
    return html;
}

// ===== RENDER PRESENTATIONS =====
function renderPresentations() {
    var homeGrid = document.getElementById('homePresGrid');
    var libGrid = document.getElementById('libraryPresGrid');
    var isAr = currentLang === 'ar';

    [homeGrid, libGrid].forEach(function(grid, idx) {
        if (!grid) return;

        var items = idx === 0 ? presentations.slice(0, 6) : presentations;

        if (items.length === 0) {
            grid.innerHTML = '<div class="empty-box">' +
                '<div class="empty-illustration">' +
                '<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#4a5568" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
                '</div><p>' + (isAr ? 'لا توجد عروض حالياً' : 'No presentations yet') + '</p>' +
                '<button class="btn-small" onclick="navigateTo('create')">' + (isAr ? 'أنشئ أول عرض' : 'Create First Presentation') + '</button></div>';
            return;
        }

        grid.innerHTML = items.map(function(p) {
            var aiBadge = p.aiGenerated ? '<span class="ai-badge">&#129302; AI</span>' : '';
            var imgStyle = p.slides && p.slides[0] && p.slides[0].image 
                ? 'background-image:url(' + p.slides[0].image + ');background-size:cover;background-position:center;'
                : 'background:' + getCategoryGradient(p.title) + ';';
            return '<div class="pres-card">' +
                '<div class="pres-thumb" style="' + imgStyle + '">' +
                '<span style="font-size:2.5rem;position:relative;z-index:1;">' + getCategoryEmoji(p.title) + '</span>' +
                aiBadge +
                '</div>' +
                '<div class="pres-info">' +
                '<h4>' + escapeHtml(p.title) + '</h4>' +
                '<div class="pres-meta">' + p.slideCount + ' ' + (isAr ? 'شريحة' : 'slides') + ' &#8226; ' + p.createdAt + '</div>' +
                '<div class="pres-actions" onclick="event.stopPropagation()">' +
                '<button onclick="openPresentation(' + p.id + ')">' + (isAr ? '&#128065; عرض' : '&#128065; View') + '</button>' +
                '<button onclick="deletePresentation(' + p.id + ')">' + (isAr ? '&#128465; حذف' : '&#128465; Delete') + '</button>' +
                '</div>' +
                '</div></div>';
        }).join('');
    });
}

function openPresentation(id) {
    var pres = presentations.find(function(p) { return p.id === id; });
    if (pres) openViewer(pres);
}

function deletePresentation(id) {
    var isAr = currentLang === 'ar';
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا العرض؟' : 'Are you sure you want to delete this presentation?')) return;
    presentations = presentations.filter(function(p) { return p.id !== id; });
    try {
        localStorage.setItem('presentations', JSON.stringify(presentations));
    } catch(e) {}
    updateLibCount();
    renderPresentations();
    showToast(isAr ? '&#128465; تم حذف العرض' : '&#128465; Presentation deleted');
}

function getCategoryGradient(title) {
    var lower = title.toLowerCase();
    if (lower.indexOf('marketing') !== -1 || lower.indexOf('تسويق') !== -1) 
        return 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
    if (lower.indexOf('education') !== -1 || lower.indexOf('تعليم') !== -1 || lower.indexOf('مهارة') !== -1) 
        return 'linear-gradient(135deg, #74b9ff, #0984e3)';
    if (lower.indexOf('business') !== -1 || lower.indexOf('أعمال') !== -1 || lower.indexOf('شركة') !== -1 || lower.indexOf('مشروع') !== -1) 
        return 'linear-gradient(135deg, #a29bfe, #6c5ce7)';
    if (lower.indexOf('tech') !== -1 || lower.indexOf('تقن') !== -1 || lower.indexOf('برمج') !== -1 || lower.indexOf('ذكاء') !== -1) 
        return 'linear-gradient(135deg, #00cec9, #00b894)';
    if (lower.indexOf('health') !== -1 || lower.indexOf('صح') !== -1 || lower.indexOf('medical') !== -1 || lower.indexOf('طب') !== -1 || lower.indexOf('نفس') !== -1) 
        return 'linear-gradient(135deg, #fd79a8, #e84393)';
    if (lower.indexOf('finance') !== -1 || lower.indexOf('مال') !== -1 || lower.indexOf('ميزانية') !== -1) 
        return 'linear-gradient(135deg, #fdcb6e, #e17055)';
    return 'linear-gradient(135deg, #6366f1, #8b5cf6)';
}

function getCategoryEmoji(title) {
    var lower = title.toLowerCase();
    if (lower.indexOf('marketing') !== -1 || lower.indexOf('تسويق') !== -1) return '&#128202;';
    if (lower.indexOf('education') !== -1 || lower.indexOf('تعليم') !== -1 || lower.indexOf('مهارة') !== -1) return '&#128218;';
    if (lower.indexOf('business') !== -1 || lower.indexOf('أعمال') !== -1 || lower.indexOf('مشروع') !== -1) return '&#128188;';
    if (lower.indexOf('tech') !== -1 || lower.indexOf('تقن') !== -1 || lower.indexOf('ذكاء') !== -1) return '&#128187;';
    if (lower.indexOf('health') !== -1 || lower.indexOf('صح') !== -1 || lower.indexOf('medical') !== -1 || lower.indexOf('طب') !== -1 || lower.indexOf('نفس') !== -1) return '&#127973;';
    if (lower.indexOf('finance') !== -1 || lower.indexOf('مال') !== -1) return '&#128176;';
    return '&#128203;';
}

function updateLibCount() {
    var badge = document.getElementById('libCount');
    if (badge) badge.textContent = presentations.length;
}

// ===== TEMPLATES =====
var TEMPLATES_DATA = [
    { title: 'استراتيجية التسويق الرقمي', titleEn: 'Digital Marketing Strategy', theme: 'modern', category: 'marketing', slides: 8, desc: 'خطة تسويق شاملة مع محتوى AI حقيقي', descEn: 'Comprehensive marketing plan with real AI content' },
    { title: 'تطوير الذات والمهارات الشخصية', titleEn: 'Self-Development & Skills', theme: 'ocean', category: 'education', slides: 8, desc: 'محتوى تعليمي مخصص بالذكاء الاصطناعي', descEn: 'Educational content customized by AI' },
    { title: 'خطة عمل لمشروع ناشئ', titleEn: 'Startup Business Plan', theme: 'sunset', category: 'business', slides: 10, desc: 'رؤية، أهداف، خطة تنفيذية مفصلة', descEn: 'Vision, goals, detailed implementation plan' },
    { title: 'تقنيات الذكاء الاصطناعي 2026', titleEn: 'AI Technologies 2026', theme: 'forest', category: 'tech', slides: 10, desc: 'أحدث التقنيات مع محتوى محدث', descEn: 'Latest technologies with updated content' },
    { title: 'الصحة النفسية والرفاهية', titleEn: 'Mental Health & Wellness', theme: 'warm', category: 'health', slides: 8, desc: 'محتوى صحي شامل ومخصص', descEn: 'Comprehensive and customized health content' },
    { title: 'إدارة المال الشخصي', titleEn: 'Personal Finance Management', theme: 'dark', category: 'finance', slides: 10, desc: 'استراتيجيات مالية عملية', descEn: 'Practical financial strategies' }
];

function renderTemplates() {
    var container = document.getElementById('templatesList');
    if (!container) return;
    var isAr = currentLang === 'ar';

    container.innerHTML = TEMPLATES_DATA.map(function(t) {
        var displayTitle = isAr ? t.title : t.titleEn;
        var displayDesc = isAr ? t.desc : t.descEn;
        var imgUrl = getSlideImage(t.category, 0);
        return '<div class="template-row" onclick="useTemplate('' + t.title + '', '' + t.theme + '')">' +
            '<div class="tpreview" style="background: linear-gradient(135deg, #' + THEMES[t.theme].bg1 + ', #' + THEMES[t.theme].bg2 + ');">' +
            '<img class="tpreview-img" src="' + imgUrl + '" alt="' + displayTitle + '" onerror="this.style.display='none'">' +
            '</div>' +
            '<div class="tinfo">' +
            '<h4>' + displayTitle + '</h4>' +
            '<p>' + displayDesc + '</p>' +
            '<span class="tcount">' + t.slides + ' ' + (isAr ? 'شرائح' : 'slides') + '</span>' +
            '</div>' +
            '</div>';
    }).join('');
}

function useTemplate(title, theme) {
    document.getElementById('presTitle').value = title;
    selectedTheme = theme;
    document.querySelectorAll('[data-theme]').forEach(function(t) {
        t.classList.toggle('active', t.dataset.theme === theme);
    });
    navigateTo('create');
}

// ===== TOAST =====
function showToast(msg, isError) {
    var toast = document.getElementById('toast');
    var text = document.getElementById('toastText');
    text.textContent = msg;
    toast.classList.toggle('error', !!isError);
    toast.classList.add('show');
    setTimeout(function() {
        toast.classList.remove('show');
    }, 3000);
}

// ===== KEYBOARD =====
document.addEventListener('keydown', function(e) {
    var viewer = document.getElementById('viewer-section');
    if (!viewer.classList.contains('active')) return;

    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'Escape') {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            navigateTo('home');
        }
    }
});

// ===== SEARCH =====
var searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        var term = e.target.value.toLowerCase();
        if (!term) { renderPresentations(); return; }

        var filtered = presentations.filter(function(p) {
            return p.title.toLowerCase().indexOf(term) !== -1 || 
                   (p.desc && p.desc.toLowerCase().indexOf(term) !== -1);
        });

        var homeGrid = document.getElementById('homePresGrid');
        var libGrid = document.getElementById('libraryPresGrid');
        var isAr = currentLang === 'ar';

        [homeGrid, libGrid].forEach(function(grid) {
            if (!grid) return;
            if (filtered.length === 0) {
                grid.innerHTML = '<div class="empty-box"><p>' + (isAr ? 'لا توجد نتائج' : 'No results') + '</p></div>';
                return;
            }
            grid.innerHTML = filtered.map(function(p) {
                return '<div class="pres-card" onclick="openPresentation(' + p.id + ')">' +
                    '<div class="pres-thumb" style="background: ' + getCategoryGradient(p.title) + '">' +
                    '<span style="font-size: 2.5rem;">' + getCategoryEmoji(p.title) + '</span>' +
                    '</div>' +
                    '<div class="pres-info">' +
                    '<h4>' + escapeHtml(p.title) + '</h4>' +
                    '<div class="pres-meta">' + p.slideCount + ' ' + (isAr ? 'شريحة' : 'slides') + ' &#8226; ' + p.createdAt + '</div>' +
                    '</div></div>';
            }).join('');
        });
    });
}

// ===== HELP =====
function showHelp() {
    var isAr = currentLang === 'ar';
    alert(isAr ? 
        '&#127919; اختصارات لوحة المفاتيح:

' +
        '&#8592; &#8594;   التنقل بين الشرائح
' +
        'ESC   إغلاق العارض / الخروج من ملء الشاشة

' +
        '&#128161; نصائح:
' +
        '&#8226; اكتب عنواناً واضحاً للحصول على محتوى AI أفضل
' +
        '&#8226; يمكنك إضافة وصف تفصيلي لتحسين النتائج
' +
        '&#8226; جميع العروض تُحفظ تلقائياً في المتصفح
' +
        '&#8226; المحتوى يُولد بالذكاء الاصطناعي أو نظام ذكي محسّن' :

        '&#127919; Keyboard Shortcuts:

' +
        '&#8592; &#8594;   Navigate between slides
' +
        'ESC   Close viewer / Exit fullscreen

' +
        '&#128161; Tips:
' +
        '&#8226; Write a clear title for better AI content
' +
        '&#8226; Add a detailed description to improve results
' +
        '&#8226; All presentations are automatically saved in browser
' +
        '&#8226; Content is generated by AI or optimized smart system'
    );
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
    var savedLang = localStorage.getItem('slidecraft_lang');
    if (savedLang) {
        setLanguage(savedLang);
    }
    updateLibCount();
    renderPresentations();
    renderTemplates();
});
