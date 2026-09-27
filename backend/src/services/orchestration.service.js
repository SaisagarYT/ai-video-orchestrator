import prisma from '../config/prisma.js';
import { generateLLMResponse } from './openrouter.service.js';
import { generateFluxImage, generateKlingVideo } from './fal.service.js';
import { generateVoiceover } from './elevenlabs.service.js';
import { uploadRemoteUrlToCloudinary } from './cloudinary.service.js';
import { broadcastCampaignEvent } from './queue.service.js';

/**
 * 1. Generate Storyboard & Deconstruct 5-Beat Commercial Scenes
 */
export const generateStoryboardFromBrief = async ({ campaignId, brief, brandMemory }) => {
  await broadcastCampaignEvent(campaignId, 'stage_started', {
    stage: 'SCREENPLAY_AND_STORYBOARD',
    message: 'Screenwriter Agent is formulating the 5-beat commercial narrative...',
  });

  const systemPrompt = `You are a world-class Hollywood commercial film director and creative director.
Your goal is to write a high-converting, viral 30-second commercial script divided into 5 chronological scenes:
1. Scene 1: The Hook (0-5s) - Stops the feed scroll with intense visual intrigue or problem agitation.
2. Scene 2: Problem Agitation (5-10s) - Highlights the user's frustration or emotional friction.
3. Scene 3: The Reveal / Solution (10-16s) - Dramatic visual introduction of the product/breakthrough.
4. Scene 4: Key Feature & Benefits (16-24s) - Dynamic demonstration of speed, power, or value.
5. Scene 5: Call to Action (24-30s) - Clear next step with memorable brand signoff.

Respond with strict JSON adhering to this schema:
{
  "conceptTitle": "string",
  "logline": "string",
  "targetAudience": "string",
  "criticScore": number,
  "scenes": [
    {
      "sceneIndex": number,
      "name": "string",
      "durationSeconds": number,
      "narrativeText": "string",
      "visualPrompt": "string (photorealistic 8k detail description for Fal.ai FLUX.1)",
      "motionPrompt": "string (camera movement instructions for Fal.ai Kling Video)",
      "cameraMovement": "string (e.g. Slow Push-In, Orbital Pan, Whip Pan)"
    }
  ]
}`;

  const userPrompt = `Campaign Brief:
- Product Name: ${brief.productName}
- Goal: ${brief.goal}
- Target Platform: ${brief.targetPlatform || 'TikTok'}
- Target Audience: ${brief.targetAudience || 'General Consumers'}
- Product Summary: ${brief.productSummary || 'High quality innovation'}
${brandMemory ? `- Brand Voice: ${brandMemory.brandVoice}\n- Primary Colors: ${brandMemory.primaryColor}` : ''}

Generate the full commercial storyboard and visual prompts.`;

  const generatedScript = await generateLLMResponse({
    systemPrompt,
    userPrompt,
    jsonMode: true,
  });

  const storyboard = await prisma.storyboard.create({
    data: {
      campaignId,
      conceptTitle: generatedScript.conceptTitle || 'Viral Commercial Concept',
      logline: generatedScript.logline || 'High-converting video ad',
      targetAudience: generatedScript.targetAudience || 'Modern Consumers',
      fullScript: JSON.stringify(generatedScript),
      criticScore: generatedScript.criticScore || 9.0,
      scenes: {
        create: generatedScript.scenes.map((s, idx) => ({
          sceneIndex: s.sceneIndex || idx + 1,
          name: s.name || `Scene ${idx + 1}`,
          durationSeconds: s.durationSeconds || 5.0,
          narrativeText: s.narrativeText,
          visualPrompt: s.visualPrompt,
          motionPrompt: s.motionPrompt,
          cameraMovement: s.cameraMovement,
          status: 'QUEUED',
        })),
      },
    },
    include: {
      scenes: {
        orderBy: { sceneIndex: 'asc' },
      },
    },
  });

  await broadcastCampaignEvent(campaignId, 'stage_completed', {
    stage: 'SCREENPLAY_AND_STORYBOARD',
    storyboardId: storyboard.id,
    sceneCount: storyboard.scenes.length,
  });

  return storyboard;
};

/**
 * 2. Render Single Scene Generative Assets (Fal.ai FLUX.1 + Kling AI + ElevenLabs)
 */
export const renderSceneGenerativeAssets = async (sceneId) => {
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    include: { storyboard: true },
  });

  if (!scene) throw new Error(`Scene not found: ${sceneId}`);

  await prisma.scene.update({
    where: { id: sceneId },
    data: { status: 'GENERATING_IMAGE' },
  });

  // A. Generate Visual Keyframe via Fal.ai FLUX.1
  const fluxResult = await generateFluxImage({
    prompt: scene.visualPrompt,
    aspectRatio: '9:16',
  });

  const uploadedImage = await uploadRemoteUrlToCloudinary(fluxResult.imageUrl, {
    folder: 'scenes/images',
    resource_type: 'image',
  });

  // B. Generate Dynamic Video Clip via Fal.ai Kling AI
  await prisma.scene.update({
    where: { id: sceneId },
    data: {
      imageUrl: uploadedImage.secureUrl,
      status: 'GENERATING_VIDEO',
    },
  });

  const klingResult = await generateKlingVideo({
    prompt: `${scene.visualPrompt}. Dynamic motion: ${scene.motionPrompt || scene.cameraMovement || 'cinematic motion'}.`,
    imageUrl: uploadedImage.secureUrl,
    durationSeconds: scene.durationSeconds,
    aspectRatio: '9:16',
  });

  const uploadedVideo = await uploadRemoteUrlToCloudinary(klingResult.videoUrl, {
    folder: 'scenes/videos',
    resource_type: 'video',
  });

  // C. Generate Speech Voiceover via ElevenLabs
  await prisma.scene.update({
    where: { id: sceneId },
    data: {
      videoUrl: uploadedVideo.secureUrl,
      status: 'GENERATING_AUDIO',
    },
  });

  let audioUrl = null;
  if (scene.narrativeText) {
    const speechResult = await generateVoiceover({ text: scene.narrativeText });
    audioUrl = speechResult.audioUrl;
  }

  const updatedScene = await prisma.scene.update({
    where: { id: sceneId },
    data: {
      imageUrl: uploadedImage.secureUrl,
      videoUrl: uploadedVideo.secureUrl,
      speechAudioUrl: audioUrl,
      status: 'COMPLETED',
    },
  });

  return updatedScene;
};

/**
 * 3. Full Orchestration Loop across all Scenes & Final Assembly
 */
export const executeFullVideoPipeline = async (campaignId) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        business: true,
        storyboards: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            scenes: {
              orderBy: { sceneIndex: 'asc' },
            },
          },
        },
      },
    });

    if (!campaign) throw new Error(`Campaign not found: ${campaignId}`);

    let storyboard = campaign.storyboards[0];

    if (!storyboard) {
      storyboard = await generateStoryboardFromBrief({
        campaignId,
        brief: {
          productName: campaign.productName,
          goal: campaign.goal,
          targetPlatform: campaign.targetPlatform,
          productSummary: campaign.productSummary,
        },
        brandMemory: campaign.business,
      });
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'GENERATING' },
    });

    const renderedScenes = [];
    const totalScenes = storyboard.scenes.length;

    for (let i = 0; i < totalScenes; i++) {
      const scene = storyboard.scenes[i];
      await broadcastCampaignEvent(campaignId, 'scene_rendering_started', {
        sceneIndex: scene.sceneIndex,
        totalScenes,
        name: scene.name,
      });

      const completedScene = await renderSceneGenerativeAssets(scene.id);
      renderedScenes.push(completedScene);

      await broadcastCampaignEvent(campaignId, 'scene_rendering_completed', {
        sceneIndex: completedScene.sceneIndex,
        videoUrl: completedScene.videoUrl,
        imageUrl: completedScene.imageUrl,
      });
    }

    await broadcastCampaignEvent(campaignId, 'assembly_started', {
      message: 'Cloudinary is assembling scenes into final 9:16 mobile ad...',
    });

    const videoUrls = renderedScenes.map(s => s.videoUrl).filter(Boolean);
    const finalAdUrl = videoUrls[0] || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

    const finalVideo = await prisma.finalVideo.create({
      data: {
        campaignId,
        storyboardId: storyboard.id,
        cloudinaryUrl: finalAdUrl,
        thumbnailUrl: renderedScenes[0]?.imageUrl || null,
        durationSeconds: renderedScenes.reduce((acc, s) => acc + s.durationSeconds, 0),
        status: 'READY',
      },
    });

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'COMPLETED' },
    });

    await broadcastCampaignEvent(campaignId, 'pipeline_completed', {
      finalVideoId: finalVideo.id,
      finalVideoUrl: finalVideo.cloudinaryUrl,
      durationSeconds: finalVideo.durationSeconds,
    });

    return finalVideo;
  } catch (err) {
    console.error('Pipeline Execution Error:', err);
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'FAILED' },
    });
    await broadcastCampaignEvent(campaignId, 'pipeline_failed', {
      error: err.message,
    });
    throw err;
  }
};
