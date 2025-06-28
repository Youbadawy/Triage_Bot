import { NextRequest, NextResponse } from 'next/server';
import { medicalReferenceService } from '@/lib/supabase/services';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action !== 'populate') {
      return NextResponse.json({ error: 'Invalid action. Use "populate"' }, { status: 400 });
    }

    console.log('🔄 Populating Supabase database with sample CAF medical documents...');
    
    // Sample CAF Medical Documents
    const sampleDocuments = [
      {
        title: 'CAF Emergency Medical Triage Protocol',
        document_type: 'protocol',
        source: 'CAF Medical Standards',
        content: `CANADIAN ARMED FORCES EMERGENCY MEDICAL TRIAGE PROTOCOL

IMMEDIATE REFERRAL TO EMERGENCY SERVICES:
- Chest pain with shortness of breath or diaphoresis
- Severe bleeding that cannot be controlled with direct pressure
- Loss of consciousness or altered mental state
- Severe allergic reactions (anaphylaxis)
- Difficulty breathing, choking, or respiratory distress
- Suspected heart attack symptoms (chest pain radiating to arm/jaw)
- Suspected stroke symptoms (facial drooping, arm weakness, speech difficulty)
- Severe burns covering >10% body surface area
- Suspected spinal injuries with neurological deficits

URGENT MEDICAL ATTENTION (within 2-4 hours):
- Moderate to severe pain that interferes with normal activities
- Persistent vomiting with signs of dehydration
- High fever (>39°C) with other concerning symptoms
- Signs of serious infection in wounds or surgical sites
- Mental health crisis with safety concerns
- Suspected fractures or significant musculoskeletal injuries

ROUTINE MEDICAL CARE (within 24-48 hours):
- Common cold and flu symptoms without complications
- Minor cuts, scrapes, and superficial wounds
- Routine medication refills and prescription renewals
- Follow-up appointments for chronic conditions
- Preventive care including immunizations

SPECIAL CONSIDERATIONS FOR CAF PERSONNEL:
- Deployment medical clearance requirements
- Aviation medicine protocols for aircrew
- Combat-related injury protocols
- Mental health support for operational stress`,
        version: '2024.1',
        tags: ['emergency', 'triage', 'protocol', 'caf']
      },
      
      {
        title: 'CAF Aviation Medicine Requirements',
        document_type: 'guideline',
        source: 'RCAF Flight Medicine',
        content: `CAF AVIATION MEDICINE REQUIREMENTS AND PROTOCOLS

PILOT MEDICAL CERTIFICATION:
1. Annual Aviation Medical Examination (AME) required
2. Medical Category Classifications:
   - Category 1: Fighter pilots, test pilots
   - Category 2: Multi-engine pilots, navigators
   - Category 3: Aircrew with medical limitations

VISION STANDARDS:
- Visual acuity: 20/20 corrected in each eye
- Color vision: Must pass Ishihara color plates
- Night vision: Normal adaptation required
- Depth perception: Stereoscopic vision required

HEARING STANDARDS:
- Audiometry: Annual testing required
- Thresholds: ≤25 dB at 500, 1000, 2000 Hz
- Speech discrimination: >90% at normal levels

CARDIOVASCULAR FITNESS:
- Resting ECG: Annual after age 35
- Exercise stress test: As clinically indicated
- Blood pressure: <140/90 mmHg

G-TOLERANCE REQUIREMENTS (Fighter Pilots):
- +9G tolerance for sustained periods
- No history of G-induced loss of consciousness
- Proper use of anti-G straining maneuvers

DISQUALIFYING CONDITIONS:
- Insulin-dependent diabetes mellitus
- History of seizures or epilepsy
- Significant psychiatric disorders
- Substance abuse disorders
- Certain cardiac arrhythmias

Contact: Wing Aviation Medicine Units at all major air bases`,
        version: '2024.1',
        tags: ['aviation', 'pilot', 'medical', 'standards', 'caf', 'rcaf']
      },

      {
        title: 'CAF Mental Health Support Guidelines',
        document_type: 'guideline',
        source: 'CAF Mental Health Services',
        content: `CAF MENTAL HEALTH SUPPORT GUIDELINES

IMMEDIATE MENTAL HEALTH CRISIS:
- Active suicidal ideation with plan or intent
- Homicidal ideation with plan or intent
- Acute psychosis or severe agitation
- Severe self-harm behaviors
ACTION: Immediate referral to emergency services

URGENT MENTAL HEALTH NEEDS:
- Suicidal ideation without immediate plan
- Severe depression interfering with daily function
- Acute stress reactions to traumatic events
- Substance abuse with safety concerns
ACTION: Same-day mental health consultation

ROUTINE MENTAL HEALTH SUPPORT:
- Mild to moderate depression or anxiety
- Adjustment disorders
- Relationship counseling
- Career transition support
ACTION: Appointment within 1-2 weeks

OPERATIONAL STRESS INJURIES (OSI):
- Post-Traumatic Stress Disorder (PTSD)
- Depression related to operational stress
- Anxiety disorders
- Moral injury from operational experiences

AVAILABLE SERVICES:
1. Unit Mental Health Teams
2. CAF Mental Health Clinics
3. Operational Stress Injury Clinics
4. Peer support programs
5. Chaplain services

24/7 CRISIS SUPPORT:
- Crisis Line: 1-800-268-7708
- Local mental health crisis teams
- Emergency departments`,
        version: '2024.1',
        tags: ['mental health', 'crisis', 'support', 'ptsd', 'caf']
      },

      {
        title: 'CAF Specialist Referral Guidelines',
        document_type: 'protocol',
        source: 'CAF Medical Services',
        content: `CAF SPECIALIST REFERRAL GUIDELINES

CARDIOLOGY REFERRALS:
Indications for urgent referral:
- New onset chest pain with cardiac risk factors
- Abnormal ECG findings
- Heart murmurs requiring evaluation
- Hypertension not responding to treatment
- Syncope of unknown origin

ORTHOPEDIC REFERRALS:
- Suspected fractures requiring specialist care
- Joint injuries affecting operational readiness
- Chronic pain not responding to conservative treatment
- Pre-operative assessment for major procedures

NEUROLOGY REFERRALS:
- Seizures or suspected seizure disorders
- Chronic headaches requiring investigation
- Neurological deficits or weakness
- Memory or cognitive concerns

REFERRAL PROCESS:
1. Primary care assessment and documentation
2. Specialist referral form completion
3. Medical records and test results compilation
4. Urgent vs. routine designation

TIMELINES:
- Urgent referrals: Within 24-48 hours
- Semi-urgent: Within 1-2 weeks
- Routine: Within 4-6 weeks
- Aviation medicine: As per flight safety requirements`,
        version: '2024.1',
        tags: ['specialist', 'referral', 'cardiology', 'orthopedic', 'caf']
      },

      {
        title: 'CAF Physical Therapy Protocol',
        document_type: 'protocol', 
        source: 'CAF Physiotherapy Services',
        content: `CAF PHYSICAL THERAPY AND REHABILITATION PROTOCOL

INDICATIONS FOR PHYSIOTHERAPY:
- Musculoskeletal injuries from training or operations
- Post-surgical rehabilitation
- Chronic pain management
- Movement dysfunction affecting performance
- Injury prevention and conditioning
- Return to duty assessments

TREATMENT MODALITIES:
- Manual therapy and mobilization
- Therapeutic exercise programs
- Modalities (ultrasound, electrical stimulation)
- Biomechanical analysis and correction
- Movement re-education
- Strength and conditioning

SPECIFIC MILITARY CONSIDERATIONS:
- Load bearing capacity with full kit
- Ability to perform tactical movements
- Endurance for extended operations
- Functional movements for trade-specific tasks

RETURN TO DUTY CRITERIA:
- Pain-free or manageable pain levels
- Full range of motion restoration
- Adequate strength for duties
- Functional movement patterns
- Successful completion of fitness test

PROGRESSIVE RETURN PROTOCOLS:
Phase 1: Light duties, no physical training
Phase 2: Modified physical training
Phase 3: Full physical training with monitoring
Phase 4: Full unrestricted duties`,
        version: '2024.1',
        tags: ['physiotherapy', 'rehabilitation', 'injury', 'fitness', 'caf']
      }
    ];

    let documentsCreated = 0;
    let failed = 0;

    // Create documents in medical_references table
    for (const doc of sampleDocuments) {
      try {
        console.log(`📄 Creating document: ${doc.title}`);
        
        const reference = await medicalReferenceService.create({
          title: doc.title,
          document_type: doc.document_type,
          source: doc.source,
          content: doc.content,
          version: doc.version,
          tags: doc.tags,
          last_updated: new Date().toISOString(),
          is_active: true
        });
        
        documentsCreated++;
        console.log(`✅ Created: ${reference.title} (ID: ${reference.id})`);
        
      } catch (error) {
        console.error(`Error creating document ${doc.title}:`, error);
        failed++;
      }
    }
    
    console.log(`🎉 Database population complete!`);
    console.log(`📊 Created: ${documentsCreated} documents`);
    console.log(`❌ Failed: ${failed} documents`);
    
    return NextResponse.json({
      success: true,
      message: 'Database populated successfully',
      documentsCreated,
      failed,
      note: 'Documents created in medical_references table. Vector indexing will happen automatically when documents are searched.'
    });
    
  } catch (error) {
    console.error('Database population error:', error);
    return NextResponse.json({ 
      error: 'Failed to populate database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'CAF Medical Database Population API',
    description: 'POST with {"action": "populate"} to add sample medical documents',
    actions: {
      populate: 'Add 5 sample CAF medical protocols and guidelines'
    },
    note: 'This will populate the Supabase database with essential CAF medical references',
    documents: [
      'CAF Emergency Medical Triage Protocol',
      'CAF Aviation Medicine Requirements', 
      'CAF Mental Health Support Guidelines',
      'CAF Specialist Referral Guidelines',
      'CAF Physical Therapy Protocol'
    ]
  });
} 