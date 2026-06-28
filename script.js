// ===== DATA & STATE =====
var presentations = [];
try {
    presentations = JSON.parse(localStorage.getItem('presentations') || '[]');
} catch(e) { presentations = []; }

var currentPres = null;
var currentSlide = 0;
var selectedCount = 8;
var selectedTheme = 'modern';

var THEMES = {
    modern: { bg1: '667eea', bg2: '764ba2', text: 'FFFFFF', dark: true },
    ocean: { bg1: '2193b0', bg2: '6dd5ed', text: 'FFFFFF', dark: true },
    sunset: { bg1: 'f093fb', bg2: 'f5576c', text: 'FFFFFF', dark: true },
    forest: { bg1: '11998e', bg2: '38ef7d', text: 'FFFFFF', dark: true },
    dark: { bg1: '232526', bg2: '414345', text: 'FFFFFF', dark: true },
    warm: { bg1: 'ff9966', bg2: 'ff5e62', text: 'FFFFFF', dark: true }
};

// ===== NAVIGATION =====
function navigateTo(section) {
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });

    var target = document.getElementById(section + '-section');
    if (target) target.classList.add('active');

    var navItem = document.querySelector('.nav-item[data-section="' + section + '"]');
    if (navItem) navItem.classList.add('active');

    if (section === 'home' || section === 'library') renderPresentations();
}

document.querySelectorAll('.nav-item').forEach(function(item) {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        navigateTo(item.dataset.section);
    });
});

// ===== QUICK START =====
function quickStart(topic) {
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

// ===== AI CONTENT GENERATION =====
async function generateAIContent(title, desc, count) {
    var fullTopic = title + (desc ? ' - ' + desc : '');

    var prompt = `أنت خبير في إنشاء العروض التقديمية. أنشئ عرض تقديمي باللغة العربية عن: "${fullTopic}"

المطلوب: ${count - 2} شريحة محتوى (بدون العنوان والختام).
لكل شريحة: عنوان قصير + 3 نقاط تفصيلية (جمل كاملة).

المحتوى يجب أن يكون:
- حقيقياً وذو قيمة عالية
- مخصصاً تماماً للموضوع "${fullTopic}"
- بالعربية الفصحى
- منظم ومنطقي

رد بتنسيق JSON فقط:
{
  "slides": [
    {"title": "...", "points": ["...", "...", "..."]},
    ...
  ]
}`;

    try {
        showToast('🤖 جاري توليد المحتوى بالذكاء الاصطناعي...');

        // Try multiple free AI APIs in order
        var slides = await tryFreeAIApis(prompt);

        if (slides && slides.length > 0) {
            return slides;
        }

        throw new Error('All APIs failed');

    } catch(error) {
        console.error('AI Error:', error);
        showToast('⚠️ استخدام نظام ذكي محسّن للمحتوى', true);
        return generateSmartFallback(title, desc, count - 2);
    }
}

async function tryFreeAIApis(prompt) {
    // API 1: Hugging Face Inference API (free, public models)
    try {
        var response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: '<s>[INST] ' + prompt + ' [/INST]',
                parameters: {
                    max_new_tokens: 1500,
                    temperature: 0.7,
                    return_full_text: false
                }
            })
        });

        if (response.ok) {
            var data = await response.json();
            var text = Array.isArray(data) ? data[0].generated_text : data.generated_text;
            var slides = extractJSONFromText(text);
            if (slides && slides.length > 0) return slides;
        }
    } catch(e) { console.log('HF API failed:', e); }

    // API 2: Try another free endpoint
    try {
        var response2 = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: prompt }],
                model: 'openai',
                seed: Math.floor(Math.random() * 1000)
            })
        });

        if (response2.ok) {
            var text2 = await response2.text();
            var slides2 = extractJSONFromText(text2);
            if (slides2 && slides2.length > 0) return slides2;
        }
    } catch(e) { console.log('Pollinations API failed:', e); }

    return null;
}

function extractJSONFromText(text) {
    if (!text) return null;

    // Try to find JSON object
    var jsonMatch = text.match(/\{[\s\S]*"slides"[\s\S]*\}/);
    if (jsonMatch) {
        try {
            var data = JSON.parse(jsonMatch[0]);
            if (data.slides && data.slides.length > 0) {
                return data.slides.map(function(s) {
                    return {
                        title: s.title || 'شريحة',
                        points: Array.isArray(s.points) ? s.points.slice(0, 3) : ['نقطة 1', 'نقطة 2', 'نقطة 3']
                    };
                });
            }
        } catch(e) {}
    }

    // Try parsing the whole text as JSON
    try {
        var data = JSON.parse(text);
        if (data.slides && data.slides.length > 0) return data.slides;
    } catch(e) {}

    // Parse text format
    return parseTextToSlides(text);
}

function parseTextToSlides(text) {
    var slides = [];
    var lines = text.split('\n').filter(function(l) { return l.trim(); });
    var currentSlide = null;

    lines.forEach(function(line) {
        line = line.trim();

        if (/^(\d+[\.\-]|###|\*\*|#)\s*/.test(line) && !line.startsWith('•') && !line.startsWith('-')) {
            if (currentSlide && currentSlide.points.length > 0) {
                slides.push(currentSlide);
            }
            var title = line.replace(/^(\d+[\.\-]|###|\*\*|#)\s*/, '').trim();
            currentSlide = { title: title, points: [] };
        }
        else if ((line.startsWith('•') || line.startsWith('-') || /^\d+\./.test(line)) && currentSlide) {
            var point = line.replace(/^[•\-\d+\.\s]*/, '').trim();
            if (point && currentSlide.points.length < 3) {
                currentSlide.points.push(point);
            }
        }
    });

    if (currentSlide && currentSlide.points.length > 0) {
        slides.push(currentSlide);
    }

    return slides.length > 0 ? slides : null;
}

function generateSmartFallback(title, desc, count) {
    var lower = (title + ' ' + (desc || '')).toLowerCase();

    var templates = {
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

    var type = 'general';
    if (lower.indexOf('تسويق') !== -1 || lower.indexOf('marketing') !== -1 || lower.indexOf('إعلان') !== -1) type = 'marketing';
    else if (lower.indexOf('تعليم') !== -1 || lower.indexOf('education') !== -1 || lower.indexOf('تدريب') !== -1 || lower.indexOf('مهارة') !== -1) type = 'education';
    else if (lower.indexOf('أعمال') !== -1 || lower.indexOf('business') !== -1 || lower.indexOf('شركة') !== -1 || lower.indexOf('مشروع') !== -1) type = 'business';
    else if (lower.indexOf('تقن') !== -1 || lower.indexOf('tech') !== -1 || lower.indexOf('برمج') !== -1 || lower.indexOf('ذكاء') !== -1 || lower.indexOf('ai') !== -1) type = 'tech';
    else if (lower.indexOf('صح') !== -1 || lower.indexOf('medical') !== -1 || lower.indexOf('طب') !== -1 || lower.indexOf('نفس') !== -1) type = 'medical';
    else if (lower.indexOf('مال') !== -1 || lower.indexOf('finance') !== -1 || lower.indexOf('ميزانية') !== -1 || lower.indexOf('استثمار') !== -1) type = 'finance';

    var content = templates[type] || templates.general;

    if (count <= content.length) {
        return content.slice(0, count);
    }

    var result = content.slice();
    var extra = count - content.length;
    for (var i = 0; i < extra; i++) {
        result.push({
            title: 'نقطة إضافية ' + (i + 1),
            points: [
                'تحليل تفصيلي للجانب ' + (i + 1) + ' من الموضوع',
                'أمثلة عملية ودراسات حالة مرتبطة',
                'استنتاجات وتوصيات عملية قابلة للتطبيق'
            ]
        });
    }
    return result;
}

// ===== GENERATE PRESENTATION =====
async function generatePresentation() {
    var title = document.getElementById('presTitle').value.trim();
    var desc = document.getElementById('presDesc').value.trim();

    if (!title) {
        showToast('❌ يرجى إدخال عنوان العرض', true);
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
        var aiSlides = await generateAIContent(title, desc, selectedCount);

        var theme = THEMES[selectedTheme];
        var slides = [];

        // Title slide
        slides.push({
            type: 'title',
            title: title,
            subtitle: desc || 'عرض تقديمي احترافي',
            bg: 'linear-gradient(135deg, #' + theme.bg1 + ', #' + theme.bg2 + ')',
            textColor: '#' + theme.text,
            accent: '#' + theme.bg1
        });

        // AI Content slides
        aiSlides.forEach(function(slide, i) {
            slides.push({
                type: 'content',
                title: slide.title,
                points: slide.points,
                bg: i % 2 === 0 ? '#ffffff' : '#f8f9fa',
                textColor: '#1a1a2e',
                accent: '#' + theme.bg1
            });
        });

        // Thank you slide
        slides.push({
            type: 'end',
            title: 'شكراً لكم',
            subtitle: 'هل لديك أي أسئلة؟',
            bg: 'linear-gradient(135deg, #' + theme.bg1 + ', #' + theme.bg2 + ')',
            textColor: '#' + theme.text,
            accent: '#' + theme.bg1
        });

        var pres = {
            id: Date.now(),
            title: title,
            desc: desc,
            theme: selectedTheme,
            slideCount: slides.length,
            slides: slides,
            aiGenerated: true,
            createdAt: new Date().toLocaleDateString('ar-SA'),
            createdTime: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
        };

        presentations.unshift(pres);
        try {
            localStorage.setItem('presentations', JSON.stringify(presentations));
        } catch(e) {}

        updateLibCount();

        document.getElementById('presTitle').value = '';
        document.getElementById('presDesc').value = '';

        showToast('✅ تم إنشاء العرض بنجاح!');
        openViewer(pres);

    } catch(error) {
        console.error(error);
        showToast('❌ حدث خطأ: ' + error.message, true);
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

    currentPres.slides.forEach(function(slide, i) {
        var layer = document.createElement('div');
        layer.className = 'slide-layer' + (i === 0 ? ' active' : '');
        layer.dataset.index = i;
        layer.style.background = slide.bg;
        layer.style.color = slide.textColor;
        layer.style.setProperty('--slide-accent', slide.accent);

        var html = '';

        if (slide.type === 'title') {
            html = '<div class="sl-title-wrap">' +
                   '<h2 class="sl-title-h2">' + escapeHtml(slide.title) + '</h2>' +
                   '<p class="sl-subtitle">' + escapeHtml(slide.subtitle) + '</p>' +
                   '</div>' +
                   '<div class="sl-num">' + (i + 1) + ' / ' + currentPres.slides.length + '</div>';
        } else if (slide.type === 'content') {
            var pointsHtml = '';
            slide.points.forEach(function(p) {
                pointsHtml += '<li><span class="sl-bullet"></span>' + escapeHtml(p) + '</li>';
            });
            html = '<h3 class="sl-content-h3">' + escapeHtml(slide.title) + '</h3>' +
                   '<div class="sl-accent-line"></div>' +
                   '<ul class="sl-list">' + pointsHtml + '</ul>' +
                   '<div class="sl-num">' + (i + 1) + ' / ' + currentPres.slides.length + '</div>';
        } else {
            html = '<div class="sl-end-wrap">' +
                   '<h2 class="sl-end-h2">' + escapeHtml(slide.title) + '</h2>' +
                   '<p class="sl-end-sub">' + escapeHtml(slide.subtitle) + '</p>' +
                   '</div>' +
                   '<div class="sl-num">' + (i + 1) + ' / ' + currentPres.slides.length + '</div>';
        }

        layer.innerHTML = html;

        var bullets = layer.querySelectorAll('.sl-bullet');
        bullets.forEach(function(b) {
            b.style.background = slide.accent;
        });

        var accentLine = layer.querySelector('.sl-accent-line');
        if (accentLine) accentLine.style.background = slide.accent;

        var contentH3 = layer.querySelector('.sl-content-h3');
        if (contentH3) contentH3.style.color = slide.accent;

        frame.appendChild(layer);
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
        thumb.style.background = slide.bg;
        thumb.onclick = function() { goToSlide(i); };
        thumb.innerHTML = '<span class="thumb-num">' + (i + 1) + '</span>';
        scroll.appendChild(thumb);
    });
}

function goToSlide(index) {
    if (index < 0 || index >= currentPres.slides.length) return;

    var layers = document.querySelectorAll('.slide-layer');
    layers.forEach(function(el, i) {
        el.classList.toggle('active', i === index);
    });

    var thumbs = document.querySelectorAll('.thumb-item');
    thumbs.forEach(function(el, i) {
        el.classList.toggle('active', i === index);
    });

    currentSlide = index;
    updateSlideIndicator();
}

function nextSlide() {
    goToSlide(currentSlide + 1);
}

function prevSlide() {
    goToSlide(currentSlide - 1);
}

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

// ===== DOWNLOAD PPTX =====
function downloadPPTX() {
    if (!currentPres) {
        showToast('❌ لا يوجد عرض للتحميل', true);
        return;
    }

    showToast('⏳ جاري إنشاء ملف PowerPoint...');

    setTimeout(function() {
        try {
            var pptx = new PptxGenJS();
            pptx.layout = 'LAYOUT_16x9';
            pptx.author = 'صانع العروض - AI';
            pptx.company = 'AI Presentation Maker';
            pptx.subject = currentPres.title;
            pptx.title = currentPres.title;

            var theme = THEMES[currentPres.theme];

            currentPres.slides.forEach(function(slide, i) {
                var s = pptx.addSlide();

                if (slide.type === 'title') {
                    s.addShape('rect', {
                        x: 0, y: 0, w: '100%', h: '100%',
                        fill: { color: theme.bg1 }
                    });

                    s.addText(slide.title, {
                        x: 0.5, y: 2.2, w: '90%', h: 1.5,
                        fontSize: 44, bold: true, color: 'FFFFFF',
                        align: 'center', fontFace: 'Arial'
                    });

                    s.addText(slide.subtitle, {
                        x: 0.5, y: 3.8, w: '90%', h: 0.8,
                        fontSize: 24, color: 'FFFFFF',
                        align: 'center', fontFace: 'Arial'
                    });

                } else if (slide.type === 'content') {
                    s.addShape('rect', {
                        x: 0, y: 0, w: '100%', h: '100%',
                        fill: { color: 'FFFFFF' }
                    });

                    s.addText(slide.title, {
                        x: 0.5, y: 0.4, w: '90%', h: 0.7,
                        fontSize: 32, bold: true, color: theme.bg1,
                        fontFace: 'Arial'
                    });

                    s.addShape('rect', {
                        x: 0.5, y: 1.1, w: 1.5, h: 0.05,
                        fill: { color: theme.bg1 }
                    });

                    slide.points.forEach(function(point, pi) {
                        s.addText('• ' + point, {
                            x: 0.7, y: 1.5 + (pi * 0.9), w: '85%', h: 0.7,
                            fontSize: 22, color: '333333',
                            fontFace: 'Arial'
                        });
                    });

                } else {
                    s.addShape('rect', {
                        x: 0, y: 0, w: '100%', h: '100%',
                        fill: { color: theme.bg1 }
                    });

                    s.addText(slide.title, {
                        x: 0.5, y: 2.2, w: '90%', h: 1.5,
                        fontSize: 48, bold: true, color: 'FFFFFF',
                        align: 'center', fontFace: 'Arial'
                    });

                    s.addText(slide.subtitle, {
                        x: 0.5, y: 3.8, w: '90%', h: 0.8,
                        fontSize: 24, color: 'FFFFFF',
                        align: 'center', fontFace: 'Arial'
                    });
                }

                s.addText(String(i + 1), {
                    x: 0.3, y: 5.2, w: 0.5, h: 0.3,
                    fontSize: 12, color: '999999',
                    align: 'left'
                });
            });

            pptx.writeFile({ fileName: currentPres.title + '.pptx' })
                .then(function() {
                    showToast('✅ تم تحميل ملف PowerPoint!');
                })
                .catch(function(err) {
                    console.error(err);
                    showToast('❌ حدث خطأ في التحميل', true);
                });

        } catch(e) {
            console.error(e);
            showToast('❌ حدث خطأ في إنشاء الملف', true);
        }
    }, 500);
}

// ===== RENDER PRESENTATIONS =====
function renderPresentations() {
    var homeGrid = document.getElementById('homePresGrid');
    var libGrid = document.getElementById('libraryPresGrid');

    [homeGrid, libGrid].forEach(function(grid, idx) {
        if (!grid) return;

        var items = idx === 0 ? presentations.slice(0, 6) : presentations;

        if (items.length === 0) {
            grid.innerHTML = '<div class="empty-box">' +
                '<div class="empty-illustration">' +
                '<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#4a5568" stroke-width="1.5">' +
                '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>' +
                '</svg></div><p>لا توجد عروض حالياً</p>' +
                '<button class="btn-small" onclick="navigateTo(\'create\')">أنشئ أول عرض</button></div>';
            return;
        }

        grid.innerHTML = items.map(function(p) {
            var aiBadge = p.aiGenerated ? '<span class="ai-badge">🤖 AI</span>' : '';
            return '<div class="pres-card">' +
                '<div class="pres-thumb" style="background: ' + getCategoryGradient(p.title) + '">' +
                '<span style="font-size: 2.5rem;">' + getCategoryEmoji(p.title) + '</span>' +
                aiBadge +
                '</div>' +
                '<div class="pres-info">' +
                '<h4>' + escapeHtml(p.title) + '</h4>' +
                '<div class="pres-meta">' + p.slideCount + ' شريحة • ' + p.createdAt + '</div>' +
                '<div class="pres-actions" onclick="event.stopPropagation()">' +
                '<button onclick="openPresentation(' + p.id + ')">👁 عرض</button>' +
                '<button onclick="deletePresentation(' + p.id + ')">🗑 حذف</button>' +
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
    if (!confirm('هل أنت متأكد من حذف هذا العرض؟')) return;
    presentations = presentations.filter(function(p) { return p.id !== id; });
    try {
        localStorage.setItem('presentations', JSON.stringify(presentations));
    } catch(e) {}
    updateLibCount();
    renderPresentations();
    showToast('🗑 تم حذف العرض');
}

function getCategoryGradient(title) {
    var lower = title.toLowerCase();
    if (lower.indexOf('تسويق') !== -1 || lower.indexOf('marketing') !== -1) 
        return 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
    if (lower.indexOf('تعليم') !== -1 || lower.indexOf('education') !== -1 || lower.indexOf('مهارة') !== -1) 
        return 'linear-gradient(135deg, #74b9ff, #0984e3)';
    if (lower.indexOf('أعمال') !== -1 || lower.indexOf('business') !== -1 || lower.indexOf('شركة') !== -1 || lower.indexOf('مشروع') !== -1) 
        return 'linear-gradient(135deg, #a29bfe, #6c5ce7)';
    if (lower.indexOf('تقن') !== -1 || lower.indexOf('tech') !== -1 || lower.indexOf('برمج') !== -1 || lower.indexOf('ذكاء') !== -1) 
        return 'linear-gradient(135deg, #00cec9, #00b894)';
    if (lower.indexOf('صح') !== -1 || lower.indexOf('medical') !== -1 || lower.indexOf('طب') !== -1 || lower.indexOf('نفس') !== -1) 
        return 'linear-gradient(135deg, #fd79a8, #e84393)';
    if (lower.indexOf('مال') !== -1 || lower.indexOf('finance') !== -1 || lower.indexOf('ميزانية') !== -1) 
        return 'linear-gradient(135deg, #fdcb6e, #e17055)';
    return 'linear-gradient(135deg, #6366f1, #8b5cf6)';
}

function getCategoryEmoji(title) {
    var lower = title.toLowerCase();
    if (lower.indexOf('تسويق') !== -1 || lower.indexOf('marketing') !== -1) return '📊';
    if (lower.indexOf('تعليم') !== -1 || lower.indexOf('education') !== -1 || lower.indexOf('مهارة') !== -1) return '📚';
    if (lower.indexOf('أعمال') !== -1 || lower.indexOf('business') !== -1 || lower.indexOf('مشروع') !== -1) return '💼';
    if (lower.indexOf('تقن') !== -1 || lower.indexOf('tech') !== -1 || lower.indexOf('ذكاء') !== -1) return '💻';
    if (lower.indexOf('صح') !== -1 || lower.indexOf('medical') !== -1 || lower.indexOf('نفس') !== -1) return '🏥';
    if (lower.indexOf('مال') !== -1 || lower.indexOf('finance') !== -1) return '💰';
    return '📋';
}

function updateLibCount() {
    var badge = document.getElementById('libCount');
    if (badge) badge.textContent = presentations.length;
}

// ===== TEMPLATES =====
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

        [homeGrid, libGrid].forEach(function(grid) {
            if (!grid) return;
            if (filtered.length === 0) {
                grid.innerHTML = '<div class="empty-box"><p>لا توجد نتائج</p></div>';
                return;
            }
            grid.innerHTML = filtered.map(function(p) {
                return '<div class="pres-card" onclick="openPresentation(' + p.id + ')">' +
                    '<div class="pres-thumb" style="background: ' + getCategoryGradient(p.title) + '">' +
                    '<span style="font-size: 2.5rem;">' + getCategoryEmoji(p.title) + '</span>' +
                    '</div>' +
                    '<div class="pres-info">' +
                    '<h4>' + escapeHtml(p.title) + '</h4>' +
                    '<div class="pres-meta">' + p.slideCount + ' شريحة • ' + p.createdAt + '</div>' +
                    '</div></div>';
            }).join('');
        });
    });
}

// ===== HELP =====
function showHelp() {
    alert('🎯 اختصارات لوحة المفاتيح:\n\n' +
          '← →   التنقل بين الشرائح\n' +
          'ESC   إغلاق العارض / الخروج من ملء الشاشة\n\n' +
          '💡 نصائح:\n' +
          '• اكتب عنواناً واضحاً للحصول على محتوى AI أفضل\n' +
          '• يمكنك إضافة وصف تفصيلي لتحسين النتائج\n' +
          '• جميع العروض تُحفظ تلقائياً في المتصفح\n' +
          '• المحتوى يُولد بالذكاء الاصطناعي أو نظام ذكي محسّن');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
    updateLibCount();
    renderPresentations();
});
