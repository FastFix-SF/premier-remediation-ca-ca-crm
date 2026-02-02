import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Settings, Image as ImageIcon, X, MoveRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { MaterialItemSettingsDialog } from './MaterialItemSettingsDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OptimizedImage } from '@/components/ui/optimized-image';

// Import equipment curb images
import tpoNewImg from '@/assets/pins/equipment-curb-tpo-new.jpg';
import tpoRetrofitImg from '@/assets/pins/equipment-curb-tpo-retrofit.jpg';
import torchNewImg from '@/assets/pins/equipment-curb-torch-new.jpg';
import torchRetrofitImg from '@/assets/pins/equipment-curb-torch-retrofit.jpg';
import shingleNewImg from '@/assets/pins/equipment-curb-shingle-new.jpg';
import shingleRetrofitImg from '@/assets/pins/equipment-curb-shingle-retrofit.jpg';
import exhaustFanImg from '@/assets/pins/exhaust-fan-curb-tpo.jpg';
import metalRetrofitImg from '@/assets/pins/equipment-curb-metal-retrofit.jpg';
import metalNewImg from '@/assets/pins/equipment-curb-metal-new.jpg';
import hvacDuctImg from '@/assets/pins/hvac-duct-curb-retrofit.jpg';
import refurbEquipmentImg from '@/assets/pins/refurbish-equipment-curb.jpg';
import refurbAtticVentImg from '@/assets/pins/refurbish-attic-vent.jpg';
import refurbSkylightImg from '@/assets/pins/refurbish-skylight-curb.jpg';
import installHipStartersImg from '@/assets/pins/install-hip-starters.jpg';
import bravaHipStartersImg from '@/assets/pins/brava-hip-starters.jpg';

// Import off-ridge vent images
import ohaginVentImg from '@/assets/pins/ohagin-vent.jpg';
import pineCrestVentImg from '@/assets/pins/pine-crest-vent.jpg';
import barrelVaultVentImg from '@/assets/pins/barrel-vault-vent.jpg';
import eyebrowVentImg from '@/assets/pins/eyebrow-vent.jpg';
import cottageShingleVentImg from '@/assets/pins/cottage-shingle-vent.jpg';
import ohaganTileVentImg from '@/assets/pins/ohagan-tile-vent.jpg';
import certainteedIntakeVentImg from '@/assets/pins/certainteed-intake-vent.jpg';
import eaveBlockVentImg from '@/assets/pins/eave-block-vent.jpg';
import soffitVentImg from '@/assets/pins/soffit-vent.jpg';
import turbineVentImg from '@/assets/pins/turbine-vent.jpg';

// Import flue & chimney caps images
import ovalFlueHorizontalImg from '@/assets/pins/oval-flue-horizontal.jpg';
import ovalFlueVerticalImg from '@/assets/pins/oval-flue-vertical.jpg';
import sparkArrestorImg from '@/assets/pins/spark-arrestor.jpg';

// Import skylights images
import skylightFlashingImg from '@/assets/pins/skylight-flashing.jpg';
import solatubeImg from '@/assets/pins/solatube.jpg';
import skylightFlat2x2Img from '@/assets/pins/skylight-flat-2x2.jpg';
import skylightFlat2x4Img from '@/assets/pins/skylight-flat-2x4.jpg';

// Import plumbing boots images
import jackPipe15Img from '@/assets/pins/jack-pipe-1-5.jpg';
import jackPipe2Img from '@/assets/pins/jack-pipe-2.jpg';
import jackPipe3Img from '@/assets/pins/jack-pipe-3.jpg';
import jackPipe4Img from '@/assets/pins/jack-pipe-4.jpg';
import dishAntennaImg from '@/assets/pins/dish-antenna.jpg';

// Import chimney flashing images
import chimneyBaseFlashingImg from '@/assets/pins/chimney-base-flashing.jpg';
import chimneyCricketImg from '@/assets/pins/chimney-cricket.jpg';

// Import paint & sealant images
import sprayPaintFlashingImg from '@/assets/pins/spray-paint-flashing.jpg';
import siliconeSealantImg from '@/assets/pins/silicone-sealant.jpg';
import waterCutoffMasticImg from '@/assets/pins/water-cutoff-mastic.jpg';

// Import miscellaneous images
import solarPanelsImg from '@/assets/pins/solar-panels.jpg';
import birdStopImg from '@/assets/pins/bird-stop.jpg';
import bayWindowRoofImg from '@/assets/pins/bay-window-roof.jpg';

// Import downspouts images
import downspout1StoryImg from '@/assets/pins/downspout-1-story.jpg';
import downspout2StoryImg from '@/assets/pins/downspout-2-story.jpg';
import roofScupperImg from '@/assets/pins/roof-scupper.jpg';
import tpoDrainOutletImg from '@/assets/pins/tpo-drain-outlet.jpg';
import commercialDrainImg from '@/assets/pins/commercial-drain.jpg';

// Import inspection pins images
import leakAreaPinImg from '@/assets/pins/leak-area-pin.jpg';
import attentionPinImg from '@/assets/pins/attention-pin.jpg';

// Import insulation images
import taperedInsulationImg from '@/assets/pins/tapered-insulation.jpg';
import isoInsulationImg from '@/assets/pins/iso-insulation.jpg';
import roofingScrewsImg from '@/assets/pins/roofing-screws.jpg';
import taperEdgeInsulationImg from '@/assets/pins/taper-edge-insulation.jpg';
import rSealInsulationImg from '@/assets/pins/r-seal-insulation.jpg';

// Import additional images for items without pictures
import removeReplaceWoodImg from '@/assets/pins/remove-replace-wood.jpg';
import butylTapeImg from '@/assets/pins/butyl-tape.jpg';
import siliconeGelWhiteImg from '@/assets/pins/silicone-gel-white.jpg';
import primerUniflexRustImg from '@/assets/pins/primer-uniflex-rust.jpg';
import barrelVaultEndDiscImg from '@/assets/pins/barrel-vault-end-disc.jpg';
import touchUpGranulesImg from '@/assets/pins/touch-up-granules.jpg';
import roofPatchRepairImg from '@/assets/pins/roof-patch-repair.jpg';
import pipeSupportBlocksImg from '@/assets/pins/pipe-support-blocks.jpg';
import sidingRepairImg from '@/assets/pins/siding-repair.jpg';
import sheetMetalCopingImg from '@/assets/pins/sheet-metal-coping.jpg';
import stuccoCutRepairImg from '@/assets/pins/stucco-cut-repair.jpg';
import rafterTailRepairImg from '@/assets/pins/rafter-tail-repair.jpg';
import galvanizedDrainOutletImg from '@/assets/pins/galvanized-drain-outlet.jpg';
import drainCompressionRingImg from '@/assets/pins/drain-compression-ring.jpg';
import leaderHeadImg from '@/assets/pins/leader-head.jpg';
import corrugatedDownspoutImg from '@/assets/pins/corrugated-downspout.jpg';
import roundDownspoutImg from '@/assets/pins/round-downspout.jpg';
import dropOutletDrainImg from '@/assets/pins/drop-outlet-drain.jpg';
import rectangularDownspoutImg from '@/assets/pins/rectangular-downspout.jpg';
import downspout3StoryImg from '@/assets/pins/downspout-3-story.jpg';
import universalBootAssemblyImg from '@/assets/pins/universal-boot-assembly.jpg';
import tpoBaseBootImg from '@/assets/pins/tpo-base-boot.jpg';
import rubberCollarImg from '@/assets/pins/rubber-collar.jpg';
import allLeadPipeBootImg from '@/assets/pins/all-lead-pipe-boot.jpg';
import leadBaseAssemblyImg from '@/assets/pins/lead-base-assembly.jpg';
import refurbishPlumbingBootImg from '@/assets/pins/refurbish-plumbing-boot.jpg';
import pvcBaseBootImg from '@/assets/pins/pvc-base-boot.jpg';
import metalRoofBootImg from '@/assets/pins/metal-roof-boot.jpg';
import refurbishChimneyFlashingImg from '@/assets/pins/refurbish-chimney-flashing.jpg';
import chimneyTopImg from '@/assets/pins/chimney-top.jpg';
import chimneyFlashingStandingSeamImg from '@/assets/pins/chimney-flashing-standing-seam.jpg';
import stuccoChimneyFlashingImg from '@/assets/pins/stucco-chimney-flashing.jpg';
import removeSkylightImg from '@/assets/pins/remove-skylight.jpg';
import skylightPanFlashingImg from '@/assets/pins/skylight-pan-flashing.jpg';
import skylightDomeReplacementImg from '@/assets/pins/skylight-dome-replacement.jpg';
import veluxSkylightImg from '@/assets/pins/velux-skylight.jpg';
import curbMountedSkylightImg from '@/assets/pins/curb-mounted-skylight.jpg';
import downspoutRepairImg from '@/assets/pins/downspout-repair.jpg';
import patchRoofTpoImg from '@/assets/pins/patch-roof-tpo.jpg';
import cleanRoofDebrisImg from '@/assets/pins/clean-roof-debris.jpg';
import satelliteDishRoofImg from '@/assets/pins/satellite-dish-roof.jpg';
import skylightCurbTpoImg from '@/assets/pins/skylight-curb-tpo.jpg';
import reinstallSunTunnelImg from '@/assets/pins/reinstall-sun-tunnel.jpg';
import flashSkylightLargeImg from '@/assets/pins/flash-skylight-large.jpg';
import reinstallAtticFanImg from '@/assets/pins/reinstall-attic-fan.jpg';
import repairSkylightSealantImg from '@/assets/pins/repair-skylight-sealant.jpg';
import skylightTorchDownImg from '@/assets/pins/skylight-torch-down.jpg';
import removeReplaceWoodDeckImg from '@/assets/pins/remove-replace-wood-deck.jpg';
import replacePlywoodSheathingImg from '@/assets/pins/replace-plywood-sheathing.jpg';
import exclusionAreaImg from '@/assets/pins/exclusion-area.jpg';
import removeExistingMaterialsImg from '@/assets/pins/remove-existing-materials.jpg';
import fasciaBoardRepairImg from '@/assets/pins/fascia-board-repair.jpg';
import rafterRepairImg from '@/assets/pins/rafter-repair.jpg';
import ridgeVentImg from '@/assets/pins/ridge-vent.jpg';
import dripEdgeFlashingImg from '@/assets/pins/drip-edge-flashing.jpg';
import valleyFlashingImg from '@/assets/pins/valley-flashing.jpg';
import stepFlashingImg from '@/assets/pins/step-flashing.jpg';
import iceWaterShieldImg from '@/assets/pins/ice-water-shield.jpg';
import syntheticUnderlaymentImg from '@/assets/pins/synthetic-underlayment.jpg';
import scaffoldingImg from '@/assets/pins/scaffolding.jpg';
import permitFeesImg from '@/assets/pins/permit-fees.jpg';
import dryRottedDeckImg from '@/assets/pins/dry-rotted-deck.jpg';
import lightWellRepairImg from '@/assets/pins/light-well-repair.jpg';
import additionalRoofLayersImg from '@/assets/pins/additional-roof-layers.jpg';
import roofRemovalImg from '@/assets/pins/roof-removal.jpg';
import damagedRaftersImg from '@/assets/pins/damaged-rafters.jpg';
import solarPanelRemovalImg from '@/assets/pins/solar-panel-removal.jpg';

// Map stored paths to imported images
const IMAGE_MAP: Record<string, string> = {
  '/src/assets/pins/equipment-curb-tpo-new.jpg': tpoNewImg,
  '/src/assets/pins/equipment-curb-tpo-retrofit.jpg': tpoRetrofitImg,
  '/src/assets/pins/equipment-curb-torch-new.jpg': torchNewImg,
  '/src/assets/pins/equipment-curb-torch-retrofit.jpg': torchRetrofitImg,
  '/src/assets/pins/equipment-curb-shingle-new.jpg': shingleNewImg,
  '/src/assets/pins/equipment-curb-shingle-retrofit.jpg': shingleRetrofitImg,
  '/src/assets/pins/exhaust-fan-curb-tpo.jpg': exhaustFanImg,
  '/src/assets/pins/equipment-curb-metal-retrofit.jpg': metalRetrofitImg,
  '/src/assets/pins/equipment-curb-metal-new.jpg': metalNewImg,
  '/src/assets/pins/hvac-duct-curb-retrofit.jpg': hvacDuctImg,
  '/src/assets/pins/refurbish-equipment-curb.jpg': refurbEquipmentImg,
  '/src/assets/pins/refurbish-attic-vent.jpg': refurbAtticVentImg,
  '/src/assets/pins/refurbish-skylight-curb.jpg': refurbSkylightImg,
  '/src/assets/pins/install-hip-starters.jpg': installHipStartersImg,
  '/src/assets/pins/brava-hip-starters.jpg': bravaHipStartersImg,
  '/src/assets/pins/ohagin-vent.jpg': ohaginVentImg,
  '/src/assets/pins/pine-crest-vent.jpg': pineCrestVentImg,
  '/src/assets/pins/barrel-vault-vent.jpg': barrelVaultVentImg,
  '/src/assets/pins/eyebrow-vent.jpg': eyebrowVentImg,
  '/src/assets/pins/cottage-shingle-vent.jpg': cottageShingleVentImg,
  '/src/assets/pins/ohagan-tile-vent.jpg': ohaganTileVentImg,
  '/src/assets/pins/certainteed-intake-vent.jpg': certainteedIntakeVentImg,
  '/src/assets/pins/eave-block-vent.jpg': eaveBlockVentImg,
  '/src/assets/pins/soffit-vent.jpg': soffitVentImg,
  '/src/assets/pins/turbine-vent.jpg': turbineVentImg,
  '/src/assets/pins/oval-flue-horizontal.jpg': ovalFlueHorizontalImg,
  '/src/assets/pins/oval-flue-vertical.jpg': ovalFlueVerticalImg,
  '/src/assets/pins/spark-arrestor.jpg': sparkArrestorImg,
  '/src/assets/pins/skylight-flashing.jpg': skylightFlashingImg,
  '/src/assets/pins/solatube.jpg': solatubeImg,
  '/src/assets/pins/skylight-flat-2x2.jpg': skylightFlat2x2Img,
  '/src/assets/pins/skylight-flat-2x4.jpg': skylightFlat2x4Img,
  '/src/assets/pins/jack-pipe-1-5.jpg': jackPipe15Img,
  '/src/assets/pins/jack-pipe-2.jpg': jackPipe2Img,
  '/src/assets/pins/jack-pipe-3.jpg': jackPipe3Img,
  '/src/assets/pins/jack-pipe-4.jpg': jackPipe4Img,
  '/src/assets/pins/dish-antenna.jpg': dishAntennaImg,
  '/src/assets/pins/chimney-base-flashing.jpg': chimneyBaseFlashingImg,
  '/src/assets/pins/chimney-cricket.jpg': chimneyCricketImg,
  '/src/assets/pins/spray-paint-flashing.jpg': sprayPaintFlashingImg,
  '/src/assets/pins/silicone-sealant.jpg': siliconeSealantImg,
  '/src/assets/pins/water-cutoff-mastic.jpg': waterCutoffMasticImg,
  '/src/assets/pins/solar-panels.jpg': solarPanelsImg,
  '/src/assets/pins/bird-stop.jpg': birdStopImg,
  '/src/assets/pins/bay-window-roof.jpg': bayWindowRoofImg,
  '/src/assets/pins/downspout-1-story.jpg': downspout1StoryImg,
  '/src/assets/pins/downspout-2-story.jpg': downspout2StoryImg,
  '/src/assets/pins/roof-scupper.jpg': roofScupperImg,
  '/src/assets/pins/tpo-drain-outlet.jpg': tpoDrainOutletImg,
  '/src/assets/pins/commercial-drain.jpg': commercialDrainImg,
  '/src/assets/pins/leak-area-pin.jpg': leakAreaPinImg,
  '/src/assets/pins/attention-pin.jpg': attentionPinImg,
  '/src/assets/pins/tapered-insulation.jpg': taperedInsulationImg,
  '/src/assets/pins/iso-insulation.jpg': isoInsulationImg,
  '/src/assets/pins/roofing-screws.jpg': roofingScrewsImg,
  '/src/assets/pins/taper-edge-insulation.jpg': taperEdgeInsulationImg,
  '/src/assets/pins/r-seal-insulation.jpg': rSealInsulationImg,
  '/src/assets/pins/remove-replace-wood.jpg': removeReplaceWoodImg,
  '/src/assets/pins/butyl-tape.jpg': butylTapeImg,
  '/src/assets/pins/silicone-gel-white.jpg': siliconeGelWhiteImg,
  '/src/assets/pins/primer-uniflex-rust.jpg': primerUniflexRustImg,
  '/src/assets/pins/barrel-vault-end-disc.jpg': barrelVaultEndDiscImg,
  '/src/assets/pins/touch-up-granules.jpg': touchUpGranulesImg,
  '/src/assets/pins/roof-patch-repair.jpg': roofPatchRepairImg,
  '/src/assets/pins/pipe-support-blocks.jpg': pipeSupportBlocksImg,
  '/src/assets/pins/siding-repair.jpg': sidingRepairImg,
  '/src/assets/pins/sheet-metal-coping.jpg': sheetMetalCopingImg,
  '/src/assets/pins/stucco-cut-repair.jpg': stuccoCutRepairImg,
  '/src/assets/pins/rafter-tail-repair.jpg': rafterTailRepairImg,
  '/src/assets/pins/galvanized-drain-outlet.jpg': galvanizedDrainOutletImg,
  '/src/assets/pins/drain-compression-ring.jpg': drainCompressionRingImg,
  '/src/assets/pins/leader-head.jpg': leaderHeadImg,
  '/src/assets/pins/corrugated-downspout.jpg': corrugatedDownspoutImg,
  '/src/assets/pins/round-downspout.jpg': roundDownspoutImg,
  '/src/assets/pins/drop-outlet-drain.jpg': dropOutletDrainImg,
  '/src/assets/pins/rectangular-downspout.jpg': rectangularDownspoutImg,
  '/src/assets/pins/downspout-3-story.jpg': downspout3StoryImg,
  '/src/assets/pins/universal-boot-assembly.jpg': universalBootAssemblyImg,
  '/src/assets/pins/tpo-base-boot.jpg': tpoBaseBootImg,
  '/src/assets/pins/rubber-collar.jpg': rubberCollarImg,
  '/src/assets/pins/all-lead-pipe-boot.jpg': allLeadPipeBootImg,
  '/src/assets/pins/lead-base-assembly.jpg': leadBaseAssemblyImg,
  '/src/assets/pins/refurbish-plumbing-boot.jpg': refurbishPlumbingBootImg,
  '/src/assets/pins/pvc-base-boot.jpg': pvcBaseBootImg,
  '/src/assets/pins/metal-roof-boot.jpg': metalRoofBootImg,
  '/src/assets/pins/refurbish-chimney-flashing.jpg': refurbishChimneyFlashingImg,
  '/src/assets/pins/chimney-top.jpg': chimneyTopImg,
  '/src/assets/pins/chimney-flashing-standing-seam.jpg': chimneyFlashingStandingSeamImg,
  '/src/assets/pins/stucco-chimney-flashing.jpg': stuccoChimneyFlashingImg,
  '/src/assets/pins/remove-skylight.jpg': removeSkylightImg,
  '/src/assets/pins/skylight-pan-flashing.jpg': skylightPanFlashingImg,
  '/src/assets/pins/skylight-dome-replacement.jpg': skylightDomeReplacementImg,
  '/src/assets/pins/velux-skylight.jpg': veluxSkylightImg,
  '/src/assets/pins/curb-mounted-skylight.jpg': curbMountedSkylightImg,
  '/src/assets/pins/downspout-repair.jpg': downspoutRepairImg,
  '/src/assets/pins/remove-replace-wood-deck.jpg': removeReplaceWoodDeckImg,
  '/src/assets/pins/replace-plywood-sheathing.jpg': replacePlywoodSheathingImg,
  '/src/assets/pins/exclusion-area.jpg': exclusionAreaImg,
  '/src/assets/pins/remove-existing-materials.jpg': removeExistingMaterialsImg,
  '/src/assets/pins/fascia-board-repair.jpg': fasciaBoardRepairImg,
  '/src/assets/pins/rafter-repair.jpg': rafterRepairImg,
  '/src/assets/pins/ridge-vent.jpg': ridgeVentImg,
  '/src/assets/pins/drip-edge-flashing.jpg': dripEdgeFlashingImg,
  '/src/assets/pins/valley-flashing.jpg': valleyFlashingImg,
  '/src/assets/pins/step-flashing.jpg': stepFlashingImg,
  '/src/assets/pins/ice-water-shield.jpg': iceWaterShieldImg,
  '/src/assets/pins/synthetic-underlayment.jpg': syntheticUnderlaymentImg,
  'scaffolding.jpg': scaffoldingImg,
  'permit-fees.jpg': permitFeesImg,
  'dry-rotted-deck.jpg': dryRottedDeckImg,
  'light-well-repair.jpg': lightWellRepairImg,
  'additional-roof-layers.jpg': additionalRoofLayersImg,
  'roof-removal.jpg': roofRemovalImg,
  'damaged-rafters.jpg': damagedRaftersImg,
  'solar-panel-removal.jpg': solarPanelRemovalImg,
};

const PIN_CATEGORIES = [
  'EQUIPMENT CURB',
  'HIP STARTERS',
  'REMOVE AND REPLACE WOOD',
  'OFF-RIDGE VENT',
  'FLUE & CHIMNEY CAPS',
  'SKYLIGHTS',
  'PLUMBING BOOTS',
  'CHIMNEY FLASHING',
  'PAINT & SEALANT',
  'MISCELLANEOUS',
  'DOWNSPOUTS',
  'INSPECTION PINS',
  'INSULATION',
  'EXCLUSIONS',
  'REMOVE',
  'ADDITIONAL ITEMS'
];

const DEFAULT_EQUIPMENT_CURB_ITEMS: Omit<PinItem, 'id'>[] = [
  {
    name: 'Roof new Equipment Curb TPO Termination bar and counterflashing',
    total: 296.25,
    unit: '$/Ea.',
    picture: tpoNewImg,
    category: 'EQUIPMENT CURB',
    coverage: 1,
    labor_cost: 131.25,
    material_cost: 165.00,
    factor: 1.00
  },
  {
    name: 'Re Roof Existing Equipment curb TPO. Termination Bar and counterflashing',
    total: 296.25,
    unit: '$/Ea.',
    picture: tpoRetrofitImg,
    category: 'EQUIPMENT CURB',
    coverage: 1,
    labor_cost: 131.25,
    material_cost: 165.00,
    factor: 1.00
  },
  {
    name: 'Roof new Equipment curb Torch Down, and counterflashing',
    total: 296.25,
    unit: '$/Ea.',
    picture: torchNewImg,
    category: 'EQUIPMENT CURB',
    coverage: 1,
    labor_cost: 131.25,
    material_cost: 165.00,
    factor: 1.00
  },
  {
    name: 'Re roof Existing Equipment curb Torch Down and counterflashing',
    total: 296.25,
    unit: '$/Ea.',
    picture: torchRetrofitImg,
    category: 'EQUIPMENT CURB',
    coverage: 1,
    labor_cost: 131.25,
    material_cost: 165.00,
    factor: 1.00
  },
  {
    name: 'Roof New Equipment Curb Shingles, new saddle and step shingles',
    total: 296.25,
    unit: '$/Ea.',
    picture: shingleNewImg,
    category: 'EQUIPMENT CURB',
    coverage: 1,
    labor_cost: 131.25,
    material_cost: 165.00,
    factor: 1.00
  },
  {
    name: 'Re roof Equpment Curb Shingles, new saddle and step shingles',
    total: 296.25,
    unit: '$/Ea.',
    picture: shingleRetrofitImg,
    category: 'EQUIPMENT CURB',
    coverage: 1,
    labor_cost: 131.25,
    material_cost: 165.00,
    factor: 1.00
  },
  {
    name: 'Roof Fan Equipment curb TPO Termination Bar and counterflashing',
    total: 296.25,
    unit: '$/Ea.',
    picture: exhaustFanImg,
    category: 'EQUIPMENT CURB',
    coverage: 1,
    labor_cost: 131.25,
    material_cost: 165.00,
    factor: 1.00
  },
  {
    name: 'Re roof Existing Equipment curb Standing Seam',
    total: 306.25,
    unit: '$/Ea.',
    picture: metalRetrofitImg,
    category: 'EQUIPMENT CURB',
    coverage: 1,
    labor_cost: 131.25,
    material_cost: 175.00,
    factor: 1.00
  },
  {
    name: 'Roof New Equipment curb Standing Seam',
    total: 306.25,
    unit: '$/Ea.',
    picture: metalNewImg,
    category: 'EQUIPMENT CURB',
    coverage: 1,
    labor_cost: 131.25,
    material_cost: 175.00,
    factor: 1.00
  },
  {
    name: 'Re Roof Existing AC Duct curb. Termination Bar and counterflashing',
    total: 306.25,
    unit: '$/Ea.',
    picture: hvacDuctImg,
    category: 'EQUIPMENT CURB',
    coverage: 1,
    labor_cost: 131.25,
    material_cost: 175.00,
    factor: 1.00
  }
];

const DEFAULT_HIP_STARTERS_ITEMS: Omit<PinItem, 'id'>[] = [
  {
    name: 'Install Hip starters -',
    total: 37.95,
    unit: '$/Ea.',
    picture: installHipStartersImg,
    category: 'HIP STARTERS',
    coverage: 1,
    labor_cost: 5.25,
    material_cost: 32.70,
    factor: 1.00
  },
  {
    name: 'Brava Hip Starters',
    total: 159.25,
    unit: '$/Ea.',
    picture: bravaHipStartersImg,
    category: 'HIP STARTERS',
    coverage: 1,
    labor_cost: 5.25,
    material_cost: 154.00,
    factor: 1.00
  }
];

const DEFAULT_OFF_RIDGE_VENT_ITEMS: Omit<PinItem, 'id'>[] = [
  {
    name: 'Install low profile O\'Hagin Vents as needed-',
    total: 84.20,
    unit: '$/Ea.',
    picture: ohaginVentImg,
    category: 'OFF-RIDGE VENT',
    coverage: 1,
    labor_cost: 31.50,
    material_cost: 52.70,
    factor: 1.00
  },
  {
    name: 'Install Boral Pine Crest EZ Vent-',
    total: 277.50,
    unit: '$/Ea.',
    picture: pineCrestVentImg,
    category: 'OFF-RIDGE VENT',
    coverage: 1,
    labor_cost: 31.50,
    material_cost: 246.00,
    factor: 1.00
  },
  {
    name: 'Install Boral barrel Vault EZ Vents-',
    total: 302.80,
    unit: '$/Ea.',
    picture: barrelVaultVentImg,
    category: 'OFF-RIDGE VENT',
    coverage: 1,
    labor_cost: 31.50,
    material_cost: 271.30,
    factor: 1.00
  },
  {
    name: 'Install lead base Eyebrow vents-',
    total: 163.30,
    unit: '$/Ea.',
    picture: eyebrowVentImg,
    category: 'OFF-RIDGE VENT',
    coverage: 1,
    labor_cost: 31.50,
    material_cost: 131.80,
    factor: 1.00
  },
  {
    name: 'Install EZ Vent Cottage Shingle-',
    total: 305.60,
    unit: '$/Ea.',
    picture: cottageShingleVentImg,
    category: 'OFF-RIDGE VENT',
    coverage: 1,
    labor_cost: 31.50,
    material_cost: 274.10,
    factor: 1.00
  },
  {
    name: 'Ohagan Tile Vent-',
    total: 90.80,
    unit: '$/Ea.',
    picture: ohaganTileVentImg,
    category: 'OFF-RIDGE VENT',
    coverage: 1,
    labor_cost: 31.50,
    material_cost: 59.30,
    factor: 1.00
  },
  {
    name: 'Install CertainTeed Intake Vent Filtered - Shingle*',
    total: 12.00,
    unit: '$/Ea.',
    picture: certainteedIntakeVentImg,
    category: 'OFF-RIDGE VENT',
    coverage: 4,
    labor_cost: 6.30,
    material_cost: 5.70,
    factor: 1.00
  },
  {
    name: 'Install/replace Eave block Vent, intake attic ventilation',
    total: 31.20,
    unit: '$/Ea.',
    picture: eaveBlockVentImg,
    category: 'OFF-RIDGE VENT',
    coverage: 1,
    labor_cost: 23.70,
    material_cost: 7.50,
    factor: 1.00
  },
  {
    name: 'Install/replace eave Sofit Vent, intake attic ventilation.',
    total: 31.20,
    unit: '$/Ea.',
    picture: soffitVentImg,
    category: 'OFF-RIDGE VENT',
    coverage: 1,
    labor_cost: 23.70,
    material_cost: 7.50,
    factor: 1.00
  },
  {
    name: 'Retro fit Existing Turbine Vent curbs into new roof system',
    total: 261.30,
    unit: '$/Ea.',
    picture: turbineVentImg,
    category: 'OFF-RIDGE VENT',
    coverage: 1,
    labor_cost: 236.30,
    material_cost: 25.00,
    factor: 1.00
  }
];

const DEFAULT_FLUE_CHIMNEY_CAPS_ITEMS: Omit<PinItem, 'id'>[] = [
  {
    name: 'Replace the Flue vent 4x8 Oval Horizontal',
    total: 69.18,
    unit: '$/Ea.',
    picture: ovalFlueHorizontalImg,
    category: 'FLUE & CHIMNEY CAPS',
    coverage: 1,
    labor_cost: 12.60,
    material_cost: 56.58,
    factor: 1.00
  },
  {
    name: 'Replace the flue vent 4x8 Oval Vertical',
    total: 69.18,
    unit: '$/Ea.',
    picture: ovalFlueVerticalImg,
    category: 'FLUE & CHIMNEY CAPS',
    coverage: 1,
    labor_cost: 12.60,
    material_cost: 56.58,
    factor: 1.00
  },
  {
    name: 'Install new spark arrestor',
    total: 192.30,
    unit: '$/Ea.',
    picture: sparkArrestorImg,
    category: 'FLUE & CHIMNEY CAPS',
    coverage: 1,
    labor_cost: 47.30,
    material_cost: 145.00,
    factor: 1.00
  }
];

const DEFAULT_SKYLIGHTS_ITEMS: Omit<PinItem, 'id'>[] = [
  {
    name: 'Install Skylight Flashing Kit, prime and paint',
    total: 250.00,
    unit: '$/Ea.',
    picture: skylightFlashingImg,
    category: 'SKYLIGHTS',
    coverage: 1,
    labor_cost: 125.00,
    material_cost: 125.00,
    factor: 1.00
  },
  {
    name: 'Install Solatube or sunn tunnel',
    total: 781.30,
    unit: '$/Ea.',
    picture: solatubeImg,
    category: 'SKYLIGHTS',
    coverage: 1,
    labor_cost: 131.30,
    material_cost: 650.00,
    factor: 1.00
  },
  {
    name: 'Roof Skylight curb TPO and install counter flashing skirt',
    total: 150.00,
    unit: '$/Ea.',
    picture: skylightCurbTpoImg,
    category: 'SKYLIGHTS',
    coverage: 1,
    labor_cost: 125.00,
    material_cost: 25.00,
    factor: 1.00
  },
  {
    name: 'Remove and re install Existing Sun tunnel, Curb Damage may occur',
    total: 90.00,
    unit: '$/Ea.',
    picture: reinstallSunTunnelImg,
    category: 'SKYLIGHTS',
    coverage: 1,
    labor_cost: 65.00,
    material_cost: 25.00,
    factor: 1.00
  },
  {
    name: 'Flash Existing 2x4 Skylight up to 4x4',
    total: 170.00,
    unit: '$/Ea.',
    picture: flashSkylightLargeImg,
    category: 'SKYLIGHTS',
    coverage: 1,
    labor_cost: 125.00,
    material_cost: 45.00,
    factor: 1.00
  },
  {
    name: 'Remove and re install Existing Attic Fan, Curb Damage may occur',
    total: 208.80,
    unit: '$/Ea.',
    picture: reinstallAtticFanImg,
    category: 'SKYLIGHTS',
    coverage: 1,
    labor_cost: 183.80,
    material_cost: 25.00,
    factor: 1.00
  },
  {
    name: 'Repair skylight sealant or Flashing low slope',
    total: 146.30,
    unit: '$/Ea.',
    picture: repairSkylightSealantImg,
    category: 'SKYLIGHTS',
    coverage: 1,
    labor_cost: 131.30,
    material_cost: 15.00,
    factor: 1.00
  },
  {
    name: 'Re roof skylight curb Torch Down',
    total: 196.30,
    unit: '$/Ea.',
    picture: skylightTorchDownImg,
    category: 'SKYLIGHTS',
    coverage: 1,
    labor_cost: 131.30,
    material_cost: 65.00,
    factor: 1.00
  },
  {
    name: 'Replace Exsiting Skylightwith new low e flat glass 2x2',
    total: 611.30,
    unit: '$/Ea.',
    picture: skylightFlat2x2Img,
    category: 'SKYLIGHTS',
    coverage: 1,
    labor_cost: 236.30,
    material_cost: 375.00,
    factor: 1.00
  },
  {
    name: 'Replace Exsiting Styligh with new low e flat glass 2x4',
    total: 586.30,
    unit: '$/Ea.',
    picture: skylightFlat2x4Img,
    category: 'SKYLIGHTS',
    coverage: 1,
    labor_cost: 236.30,
    material_cost: 350.00,
    factor: 1.00
  }
];

const DEFAULT_PLUMBING_BOOTS_ITEMS: Omit<PinItem, 'id'>[] = [
  {
    name: 'Install 1 1/2" Jack Pipe comp base prime and paint-',
    total: 12.12,
    unit: '$/Ea.',
    picture: jackPipe15Img,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 8.12,
    factor: 1.00
  },
  {
    name: 'Install 2" Jack pipe comp base Prime and Paint-',
    total: 12.12,
    unit: '$/Ea.',
    picture: jackPipe2Img,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 8.12,
    factor: 1.00
  },
  {
    name: 'Install 3" Jack pipe comp base Prime and paint-',
    total: 20.20,
    unit: '$/Ea.',
    picture: jackPipe3Img,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 15.70,
    factor: 1.00
  },
  {
    name: 'Install 4" jack pipe comp base Prime and paint-',
    total: 19.40,
    unit: '$/Ea.',
    picture: jackPipe4Img,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 18.40,
    factor: 1.00
  },
  {
    name: 'Install 4" 025 Assembly "-',
    total: 48.60,
    unit: '$/Ea.',
    picture: universalBootAssemblyImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 44.00,
    factor: 1.08
  },
  {
    name: 'Install New Dish antenna roof mount',
    total: 45.40,
    unit: '$/Ea.',
    picture: dishAntennaImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 44.40,
    factor: 1.00
  },
  {
    name: 'Install 6" 025 Assembly"-',
    total: 63.83,
    unit: '$/Ea.',
    picture: universalBootAssemblyImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 56.50,
    factor: 1.11
  },
  {
    name: 'Install TPO Universal Boot 2.5" - 4" -',
    total: 55.60,
    unit: '$/Ea.',
    picture: tpoBaseBootImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 54.60,
    factor: 1.00
  },
  {
    name: 'Install TPO 6" 025 Base Boot -',
    total: 105.10,
    unit: '$/Ea.',
    picture: tpoBaseBootImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 104.10,
    factor: 1.00
  },
  {
    name: 'Install TPO 4" 025 Base Boot-',
    total: 94.40,
    unit: '$/Ea.',
    picture: tpoBaseBootImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 93.40,
    factor: 1.00
  },
  {
    name: 'Install Universal booth for standing seam metal roof',
    total: 24.60,
    unit: '$/Ea.',
    picture: metalRoofBootImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 12.60,
    material_cost: 12.00,
    factor: 1.00
  },
  {
    name: 'Install 8" 025 assembly"-',
    total: 72.23,
    unit: '$/Ea.',
    picture: universalBootAssemblyImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 66.50,
    factor: 1.07
  },
  {
    name: 'Install TPO 8" 025 Base Boot-',
    total: 131.70,
    unit: '$/Ea.',
    picture: tpoBaseBootImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 130.70,
    factor: 1.00
  },
  {
    name: 'Install rubber collar on 1-1/2" plumbing pipe^',
    total: 4.00,
    unit: '$/Ea.',
    picture: rubberCollarImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 3.00,
    factor: 1.00
  },
  {
    name: 'Install Rubber collar on 2" Plumbing pipe^',
    total: 4.00,
    unit: '$/Ea.',
    picture: rubberCollarImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 3.00,
    factor: 1.00
  },
  {
    name: 'Install Rubber collar on 3" Plumbing pipe^',
    total: 4.50,
    unit: '$/Ea.',
    picture: rubberCollarImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 3.50,
    factor: 1.00
  },
  {
    name: 'Install all Lead Pipe Boot 1-1/2" -',
    total: 50.00,
    unit: '$/Ea.',
    picture: allLeadPipeBootImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 46.00,
    factor: 1.00
  },
  {
    name: 'Install all Lead Pipe Boot 2" -',
    total: 50.00,
    unit: '$/Ea.',
    picture: allLeadPipeBootImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 46.00,
    factor: 1.00
  },
  {
    name: 'Install all Lead Pipe Boot 3" -',
    total: 65.40,
    unit: '$/Ea.',
    picture: allLeadPipeBootImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 57.40,
    factor: 1.00
  },
  {
    name: 'Install All Lead Pipe Boot 4" -',
    total: 62.10,
    unit: '$/Ea.',
    picture: allLeadPipeBootImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 61.10,
    factor: 1.00
  },
  {
    name: 'Install 4" Lead Base Assemblies-',
    total: 102.07,
    unit: '$/Ea.',
    picture: leadBaseAssemblyImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 98.10,
    factor: 1.03
  },
  {
    name: 'Install 6" Lead Base Assemblies-',
    total: 130.36,
    unit: '$/Ea.',
    picture: leadBaseAssemblyImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 126.80,
    factor: 1.02
  },
  {
    name: 'Install 8" Lead Base Assemblies-',
    total: 137.20,
    unit: '$/Ea.',
    picture: leadBaseAssemblyImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 136.20,
    factor: 1.00
  },
  {
    name: 'Refurbis Existing plumbing boot base with silicon base only',
    total: 41.30,
    unit: '$/Ea.',
    picture: refurbishPlumbingBootImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 26.30,
    material_cost: 15.00,
    factor: 1.00
  },
  {
    name: 'Install PVC Universal Boot 2.5" - 4" -',
    total: 85.00,
    unit: '$/Ea.',
    picture: pvcBaseBootImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 84.00,
    factor: 1.00
  },
  {
    name: 'Install PVC 4" 025 Base Boot-',
    total: 94.40,
    unit: '$/Ea.',
    picture: pvcBaseBootImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 93.40,
    factor: 1.00
  },
  {
    name: 'Install PVC 6" 025 Base Boot-',
    total: 105.10,
    unit: '$/Ea.',
    picture: pvcBaseBootImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 104.10,
    factor: 1.00
  },
  {
    name: 'Install PVC 8" 025 Base Boot-',
    total: 131.70,
    unit: '$/Ea.',
    picture: pvcBaseBootImg,
    category: 'PLUMBING BOOTS',
    coverage: 1,
    labor_cost: 1.00,
    material_cost: 130.70,
    factor: 1.00
  }
];

const DEFAULT_CHIMNEY_FLASHING_ITEMS: Omit<PinItem, 'id'>[] = [
  {
    name: 'Remove and replace Chimney Base flashing and counter flashing',
    total: 232.30,
    unit: '$/Ea.',
    picture: chimneyBaseFlashingImg,
    category: 'CHIMNEY FLASHING',
    coverage: 1,
    labor_cost: 152.30,
    material_cost: 80.00,
    factor: 1.00
  },
  {
    name: 'Refurbish Existing Chimney Flashing-Paint & Seal',
    total: 35.99,
    unit: '$/Ea.',
    picture: refurbishChimneyFlashingImg,
    category: 'CHIMNEY FLASHING',
    coverage: 1,
    labor_cost: 26.30,
    material_cost: 5.00,
    factor: 1.15
  },
  {
    name: 'Remove and replace Chimney Flashing With Cricket',
    total: 368.56,
    unit: '$/Ea.',
    picture: chimneyCricketImg,
    category: 'CHIMNEY FLASHING',
    coverage: 1,
    labor_cost: 278.30,
    material_cost: 45.00,
    factor: 1.14
  },
  {
    name: 'Remove and replace Chimney top',
    total: 578.80,
    unit: '$/Ea.',
    picture: chimneyTopImg,
    category: 'CHIMNEY FLASHING',
    coverage: 1,
    labor_cost: 498.80,
    material_cost: 80.00,
    factor: 1.00
  },
  {
    name: 'install new chimney flashing ands counterflashing SSeam',
    total: 403.30,
    unit: '$/Ea.',
    picture: chimneyFlashingStandingSeamImg,
    category: 'CHIMNEY FLASHING',
    coverage: 1,
    labor_cost: 278.30,
    material_cost: 125.00,
    factor: 1.00
  },
  {
    name: 'Remove 8" of stucco at chimney wall, insert new flashings and patch stucco',
    total: 375.00,
    unit: '$/Ea.',
    picture: stuccoChimneyFlashingImg,
    category: 'CHIMNEY FLASHING',
    coverage: 1,
    labor_cost: 315.00,
    material_cost: 60.00,
    factor: 1.00
  }
];

const DEFAULT_PAINT_SEALANT_ITEMS: Omit<PinItem, 'id'>[] = [
  {
    name: 'Spray Paint All Exposed Flashings -',
    total: 12.00,
    unit: '$/Ea.',
    picture: sprayPaintFlashingImg,
    category: 'PAINT & SEALANT',
    coverage: 1,
    labor_cost: 0.00,
    material_cost: 12.00,
    factor: 1.00
  },
  {
    name: 'Silicone Sealant -',
    total: 12.30,
    unit: '$/Ea.',
    picture: siliconeSealantImg,
    category: 'PAINT & SEALANT',
    coverage: 1,
    labor_cost: 0.00,
    material_cost: 12.30,
    factor: 1.00
  },
  {
    name: 'Water Cutt Off mastic',
    total: 18.00,
    unit: '$/Ea.',
    picture: waterCutoffMasticImg,
    category: 'PAINT & SEALANT',
    coverage: 1,
    labor_cost: 0.00,
    material_cost: 18.00,
    factor: 1.00
  },
  {
    name: 'Butll Tape',
    total: 18.00,
    unit: '$/Ea.',
    picture: butylTapeImg,
    category: 'PAINT & SEALANT',
    coverage: 32,
    labor_cost: 0.00,
    material_cost: 18.00,
    factor: 1.00
  },
  {
    name: 'Silicone Gel White ^',
    total: 295.50,
    unit: '$/Ea.',
    picture: siliconeGelWhiteImg,
    category: 'PAINT & SEALANT',
    coverage: 30,
    labor_cost: 21.00,
    material_cost: 274.50,
    factor: 1.00
  },
  {
    name: 'Primer Uniflex Rust',
    total: 562.45,
    unit: '$/Ea.',
    picture: primerUniflexRustImg,
    category: 'PAINT & SEALANT',
    coverage: 1,
    labor_cost: 0.00,
    material_cost: 0.00,
    factor: 1.00
  }
];

const DEFAULT_MISCELLANEOUS_ITEMS: Omit<PinItem, 'id'>[] = [
  {
    name: 'Barrel Vault Hip/Ridge End Discs-',
    total: 5.60,
    unit: '$/Ea.',
    picture: barrelVaultEndDiscImg,
    category: 'MISCELLANEOUS',
    coverage: 1,
    labor_cost: 1.10,
    material_cost: 4.50,
    factor: 1.00
  },
  {
    name: 'Bird Stop 3.5"-',
    total: 17.60,
    unit: '$/Ea.',
    picture: birdStopImg,
    category: 'MISCELLANEOUS',
    coverage: 1,
    labor_cost: 0.00,
    material_cost: 0.00,
    factor: 1.00
  },
  {
    name: 'Remove and re install Solar panels',
    total: 256.30,
    unit: '$/Ea.',
    picture: solarPanelsImg,
    category: 'MISCELLANEOUS',
    coverage: 1,
    labor_cost: 131.30,
    material_cost: 125.00,
    factor: 1.00
  },
  {
    name: 'Touch up Granules -',
    total: 14.00,
    unit: '$/Ea.',
    picture: touchUpGranulesImg,
    category: 'MISCELLANEOUS',
    coverage: 15,
    labor_cost: 0.00,
    material_cost: 14.00,
    factor: 1.00
  },
  {
    name: 'Repair / Patch roof as needed., low slope with similar',
    total: 256.30,
    unit: '$/Ea.',
    picture: roofPatchRepairImg,
    category: 'MISCELLANEOUS',
    coverage: 1,
    labor_cost: 131.30,
    material_cost: 125.00,
    factor: 1.00
  },
  {
    name: 'Remove and replace pipe support blocks.',
    total: 119.00,
    unit: '$/Ea.',
    picture: pipeSupportBlocksImg,
    category: 'MISCELLANEOUS',
    coverage: 1,
    labor_cost: 21.00,
    material_cost: 98.00,
    factor: 1.00
  },
  {
    name: 'Repair Siding as needed, Priem and paint',
    total: 256.30,
    unit: '$/Ea.',
    picture: sidingRepairImg,
    category: 'MISCELLANEOUS',
    coverage: 1,
    labor_cost: 131.30,
    material_cost: 125.00,
    factor: 1.00
  },
  {
    name: 'Install sheet metal copping at beam tails',
    total: 62.30,
    unit: '$/Ea.',
    picture: sheetMetalCopingImg,
    category: 'MISCELLANEOUS',
    coverage: 1,
    labor_cost: 47.30,
    material_cost: 15.00,
    factor: 1.00
  },
  {
    name: 'Cut Stucco 8" to insert RTW flashing, repair stucco, prime and',
    total: 36.30,
    unit: '$/Ea.',
    picture: stuccoCutRepairImg,
    category: 'MISCELLANEOUS',
    coverage: 1,
    labor_cost: 26.30,
    material_cost: 10.00,
    factor: 1.00
  },
  {
    name: 'Replace damaged rafter tail 2x4/2x6 Prime and paint to match',
    total: 46.80,
    unit: '$/Ea.',
    picture: rafterTailRepairImg,
    category: 'MISCELLANEOUS',
    coverage: 1,
    labor_cost: 36.80,
    material_cost: 10.00,
    factor: 1.00
  },
  {
    name: 'Install Roof on Bay window',
    total: 550.00,
    unit: '$/Ea.',
    picture: bayWindowRoofImg,
    category: 'MISCELLANEOUS',
    coverage: 1,
    labor_cost: 400.00,
    material_cost: 150.00,
    factor: 1.00
  }
];

const DEFAULT_DOWNSPOUTS_ITEMS: Omit<PinItem, 'id'>[] = [
  {
    name: 'Install All 1 Story Downspout Aluminum 10\'',
    total: 112.30,
    unit: '$/Ea.',
    picture: downspout1StoryImg,
    category: 'DOWNSPOUTS',
    coverage: 1,
    labor_cost: 47.30,
    material_cost: 65.00,
    factor: 1.00
  },
  {
    name: 'Install all 2 Story Downspout Aluminum 20',
    total: 158.50,
    unit: '$/Ea.',
    picture: downspout2StoryImg,
    category: 'DOWNSPOUTS',
    coverage: 1,
    labor_cost: 73.50,
    material_cost: 85.00,
    factor: 1.00
  },
  {
    name: 'Install Roof scupper 24 gage Galvanized 4x4',
    total: 117.30,
    unit: '$/Ea.',
    picture: roofScupperImg,
    category: 'DOWNSPOUTS',
    coverage: 1,
    labor_cost: 47.30,
    material_cost: 70.00,
    factor: 1.00
  },
  {
    name: 'Install Roof scupper TPO/PVC 4x4',
    total: 113.30,
    unit: '$/Ea.',
    picture: roofScupperImg,
    category: 'DOWNSPOUTS',
    coverage: 1,
    labor_cost: 68.30,
    material_cost: 45.00,
    factor: 1.00
  },
  {
    name: 'Install 2" TPO/PVC Drain outlet',
    total: 124.30,
    unit: '$/Ea.',
    picture: tpoDrainOutletImg,
    category: 'DOWNSPOUTS',
    coverage: 1,
    labor_cost: 68.30,
    material_cost: 56.00,
    factor: 1.00
  },
  {
    name: 'Install 3" TPO/PVC Drain outlet',
    total: 132.30,
    unit: '$/Ea.',
    picture: tpoDrainOutletImg,
    category: 'DOWNSPOUTS',
    coverage: 1,
    labor_cost: 68.30,
    material_cost: 64.00,
    factor: 1.00
  },
  {
    name: 'Install 2" Galvanized Drain outlet',
    total: 83.30,
    unit: '$/Ea.',
    picture: galvanizedDrainOutletImg,
    category: 'DOWNSPOUTS',
    coverage: 1,
    labor_cost: 68.30,
    material_cost: 15.00,
    factor: 1.00
  },
  {
    name: 'Remove and re Install Drain Compression Ring',
    total: 196.30,
    unit: '$/Ea.',
    picture: drainCompressionRingImg,
    category: 'DOWNSPOUTS',
    coverage: 1,
    labor_cost: 131.30,
    material_cost: 65.00,
    factor: 1.00
  },
  {
    name: 'Install New Leader head',
    total: 153.30,
    unit: '$/Ea.',
    picture: leaderHeadImg,
    category: 'DOWNSPOUTS',
    coverage: 1,
    labor_cost: 68.30,
    material_cost: 85.00,
    factor: 1.00
  },
  {
    name: 'Install 3x3 Corrugated or smooth Downspout Two Story',
    total: 386.30,
    unit: '$/Ea.',
    picture: corrugatedDownspoutImg,
    category: 'DOWNSPOUTS',
    coverage: 1,
    labor_cost: 236.30,
    material_cost: 150.00,
    factor: 1.00
  },
  {
    name: 'Install 3" Round Downspout I Story',
    total: 281.30,
    unit: '$/Ea.',
    picture: roundDownspoutImg,
    category: 'DOWNSPOUTS',
    coverage: 1,
    labor_cost: 131.30,
    material_cost: 150.00,
    factor: 1.00
  },
  {
    name: 'Install 3" Round Downspout 2 Story',
    total: 486.30,
    unit: '$/Ea.',
    picture: roundDownspoutImg,
    category: 'DOWNSPOUTS',
    coverage: 1,
    labor_cost: 236.30,
    material_cost: 250.00,
    factor: 1.00
  },
  {
    name: 'Install 3" Round Downspout 3 Story',
    total: 691.30,
    unit: '$/Ea.',
    picture: roundDownspoutImg,
    category: 'DOWNSPOUTS',
    coverage: 1,
    labor_cost: 341.30,
    material_cost: 350.00,
    factor: 1.00
  },
  {
    name: 'Install 3" Round Downspout 4 Story',
    total: 947.50,
    unit: '$/Ea.',
    picture: roundDownspoutImg,
    category: 'DOWNSPOUTS',
    coverage: 1,
    labor_cost: 472.50,
    material_cost: 475.00,
    factor: 1.00
  },
  {
    name: 'Repair Downspouts as needed.',
    total: 281.30,
    unit: '$/Ea.',
    picture: downspoutRepairImg,
    category: 'DOWNSPOUTS',
    coverage: 1,
    labor_cost: 236.30,
    material_cost: 45.00,
    factor: 1.00
  },
  {
    name: 'Install 3" Galvanized Drop outlet Drain.',
    total: 71.30,
    unit: '$/Ea.',
    picture: dropOutletDrainImg,
    category: 'DOWNSPOUTS',
    coverage: 1,
    labor_cost: 26.30,
    material_cost: 45.00,
    factor: 1.00
  },
  {
    name: 'Install 2x3 Rectangular spouts kynar pre painted 1 Story',
    total: 113.50,
    unit: '$/Ea.',
    picture: rectangularDownspoutImg,
    category: 'DOWNSPOUTS',
    coverage: 1,
    labor_cost: 73.50,
    material_cost: 40.00,
    factor: 1.00
  },
  {
    name: 'Install 2x3 Rectangular spouts kynar pre painted 2 Story',
    total: 175.00,
    unit: '$/Ea.',
    picture: rectangularDownspoutImg,
    category: 'DOWNSPOUTS',
    coverage: 1,
    labor_cost: 105.00,
    material_cost: 70.00,
    factor: 1.00
  },
  {
    name: 'Install New commercial drain assembly,',
    total: 881.30,
    unit: '$/Ea.',
    picture: commercialDrainImg,
    category: 'DOWNSPOUTS',
    coverage: 1,
    labor_cost: 656.30,
    material_cost: 225.00,
    factor: 1.00
  },
  {
    name: 'Install all 3 Story Downspout Aluminum 30\'',
    total: 199.50,
    unit: '$/Ea.',
    picture: downspout3StoryImg,
    category: 'DOWNSPOUTS',
    coverage: 1,
    labor_cost: 94.50,
    material_cost: 105.00,
    factor: 1.00
  },
  {
    name: 'Install 3x4 Steel Downspouts 1 Story Kynar coated',
    total: 138.50,
    unit: '$/Ea.',
    picture: rectangularDownspoutImg,
    category: 'DOWNSPOUTS',
    coverage: 1,
    labor_cost: 73.50,
    material_cost: 65.00,
    factor: 1.00
  },
  {
    name: 'Install 3x4 Steel Downspouts 2 Story Kynar coated',
    total: 235.00,
    unit: '$/Ea.',
    picture: rectangularDownspoutImg,
    category: 'DOWNSPOUTS',
    coverage: 1,
    labor_cost: 125.00,
    material_cost: 110.00,
    factor: 1.00
  }
];

const DEFAULT_INSPECTION_PINS_ITEMS: Omit<PinItem, 'id'>[] = [
  {
    name: 'Leak Area',
    total: 0.00,
    unit: '$/Ea.',
    picture: leakAreaPinImg,
    category: 'INSPECTION PINS',
    coverage: 0,
    labor_cost: 0.00,
    material_cost: 0.00,
    factor: 1.00
  },
  {
    name: 'Attention Area',
    total: 0.00,
    unit: '$/Ea.',
    picture: attentionPinImg,
    category: 'INSPECTION PINS',
    coverage: 0,
    labor_cost: 0.00,
    material_cost: 0.00,
    factor: 1.00
  },
  {
    name: 'Photo',
    total: 0.00,
    unit: '$/Ea.',
    picture: attentionPinImg,
    category: 'INSPECTION PINS',
    coverage: 0,
    labor_cost: 0.00,
    material_cost: 0.00,
    factor: 1.00
  },
  {
    name: 'Remove and replace Chimney top Cap with Similar 24 gauge G',
    total: 710.00,
    unit: '$/Ea.',
    picture: chimneyTopImg,
    category: 'INSPECTION PINS',
    coverage: 1,
    labor_cost: 630.00,
    material_cost: 80.00,
    factor: 1.00
  },
  {
    name: 'Patch roof  TPO PVC Torch Low Slope Time and materials',
    total: 256.30,
    unit: '$/Ea.',
    picture: patchRoofTpoImg,
    category: 'INSPECTION PINS',
    coverage: 1,
    labor_cost: 131.30,
    material_cost: 125.00,
    factor: 1.00
  },
  {
    name: 'Clean roof debris and haul away',
    total: 171.30,
    unit: '$/Ea.',
    picture: cleanRoofDebrisImg,
    category: 'INSPECTION PINS',
    coverage: 1,
    labor_cost: 131.30,
    material_cost: 40.00,
    factor: 1.00
  },
  {
    name: 'Remove & Reset Satellite Dish and patch roof as needed',
    total: 141.30,
    unit: '$/Ea.',
    picture: satelliteDishRoofImg,
    category: 'INSPECTION PINS',
    coverage: 1,
    labor_cost: 131.30,
    material_cost: 10.00,
    factor: 1.00
  }
];

const DEFAULT_REMOVE_AND_REPLACE_WOOD_ITEMS: Omit<PinItem, 'id'>[] = [
  {
    name: 'Remove and replace damaged wood deck boards',
    total: 150.00,
    unit: '$/Ea.',
    picture: removeReplaceWoodDeckImg,
    category: 'REMOVE AND REPLACE WOOD',
    coverage: 1,
    labor_cost: 100.00,
    material_cost: 50.00,
    factor: 1.00
  },
  {
    name: 'Replace plywood sheathing damaged sections',
    total: 180.00,
    unit: '$/Sheet',
    picture: replacePlywoodSheathingImg,
    category: 'REMOVE AND REPLACE WOOD',
    coverage: 1,
    labor_cost: 120.00,
    material_cost: 60.00,
    factor: 1.00
  },
  {
    name: 'Repair or replace fascia boards',
    total: 125.00,
    unit: '$/LF',
    picture: fasciaBoardRepairImg,
    category: 'REMOVE AND REPLACE WOOD',
    coverage: 1,
    labor_cost: 85.00,
    material_cost: 40.00,
    factor: 1.00
  },
  {
    name: 'Rafter repair or sistering',
    total: 200.00,
    unit: '$/Ea.',
    picture: rafterRepairImg,
    category: 'REMOVE AND REPLACE WOOD',
    coverage: 1,
    labor_cost: 150.00,
    material_cost: 50.00,
    factor: 1.00
  },
  {
    name: 'Replace rafter tail sections',
    total: 85.00,
    unit: '$/Ea.',
    picture: rafterTailRepairImg,
    category: 'REMOVE AND REPLACE WOOD',
    coverage: 1,
    labor_cost: 65.00,
    material_cost: 20.00,
    factor: 1.00
  }
];

const DEFAULT_EXCLUSIONS_ITEMS: Omit<PinItem, 'id'>[] = [
  {
    name: 'Exclusion Area - No Work Zone',
    total: 0.00,
    unit: '$/SF',
    picture: exclusionAreaImg,
    category: 'EXCLUSIONS',
    coverage: 0,
    labor_cost: 0.00,
    material_cost: 0.00,
    factor: 1.00
  },
  {
    name: 'Roof section excluded from project',
    total: 0.00,
    unit: '$/SF',
    picture: exclusionAreaImg,
    category: 'EXCLUSIONS',
    coverage: 0,
    labor_cost: 0.00,
    material_cost: 0.00,
    factor: 1.00
  }
];

const DEFAULT_REMOVE_ITEMS: Omit<PinItem, 'id'>[] = [
  {
    name: 'Remove existing roofing materials',
    total: 125.00,
    unit: '$/SQ',
    picture: removeExistingMaterialsImg,
    category: 'REMOVE',
    coverage: 1,
    labor_cost: 100.00,
    material_cost: 25.00,
    factor: 1.00
  },
  {
    name: 'Remove old skylight',
    total: 75.00,
    unit: '$/Ea.',
    picture: removeSkylightImg,
    category: 'REMOVE',
    coverage: 1,
    labor_cost: 60.00,
    material_cost: 15.00,
    factor: 1.00
  }
];

const DEFAULT_ADDITIONAL_ITEMS: Omit<PinItem, 'id'>[] = [
  {
    name: 'Scaffolding',
    total: 0.00,
    unit: '$/Ea.',
    picture: scaffoldingImg,
    category: 'ADDITIONAL ITEMS',
    coverage: 1,
    labor_cost: 0.00,
    material_cost: 0.00,
    factor: 1.00
  },
  {
    name: 'Permit Fees/ Parking permit fees',
    total: 200.00,
    unit: '$/Ea.',
    picture: permitFeesImg,
    category: 'ADDITIONAL ITEMS',
    coverage: 1,
    labor_cost: 0.00,
    material_cost: 0.00,
    factor: 1.00
  },
  {
    name: 'Dry Rotted or Damaged roof deck/ Termite Damage',
    total: 0.00,
    unit: '$/Ea.',
    picture: dryRottedDeckImg,
    category: 'ADDITIONAL ITEMS',
    coverage: 1,
    labor_cost: 0.00,
    material_cost: 0.00,
    factor: 1.00
  },
  {
    name: 'Light Well re-roof or repairs',
    total: 0.00,
    unit: '$/Ea.',
    picture: lightWellRepairImg,
    category: 'ADDITIONAL ITEMS',
    coverage: 1,
    labor_cost: 0.00,
    material_cost: 0.00,
    factor: 1.00
  },
  {
    name: 'Additional Roof layers to be removed if any @ $65.00 per Sqr.',
    total: 0.00,
    unit: '$/Ea.',
    picture: additionalRoofLayersImg,
    category: 'ADDITIONAL ITEMS',
    coverage: 1,
    labor_cost: 0.00,
    material_cost: 0.00,
    factor: 1.00
  },
  {
    name: 'Roof Removal',
    total: 0.00,
    unit: '$/Ea.',
    picture: roofRemovalImg,
    category: 'ADDITIONAL ITEMS',
    coverage: 1,
    labor_cost: 0.00,
    material_cost: 0.00,
    factor: 1.00
  },
  {
    name: 'Dry Rotted or Damaged Rafters',
    total: 0.00,
    unit: '$/Ea.',
    picture: damagedRaftersImg,
    category: 'ADDITIONAL ITEMS',
    coverage: 1,
    labor_cost: 0.00,
    material_cost: 0.00,
    factor: 1.00
  },
  {
    name: 'Solar panel Removal and re-installation',
    total: 0.00,
    unit: '$/Ea.',
    picture: solarPanelRemovalImg,
    category: 'ADDITIONAL ITEMS',
    coverage: 1,
    labor_cost: 0.00,
    material_cost: 0.00,
    factor: 1.00
  }
];

const DEFAULT_INSULATION_ITEMS: Omit<PinItem, 'id'>[] = [
  {
    name: 'Install Tapered Insulation "X"1/4" slope per foot, mechanically',
    total: 24.00,
    unit: '$/Ea.',
    picture: taperedInsulationImg,
    category: 'INSULATION',
    coverage: 1,
    labor_cost: 8.00,
    material_cost: 16.00,
    factor: 1.00
  },
  {
    name: 'Install Tapered Insulation "Y"1/4" slope per foot, mechanically',
    total: 42.00,
    unit: '$/Ea.',
    picture: taperedInsulationImg,
    category: 'INSULATION',
    coverage: 1,
    labor_cost: 8.00,
    material_cost: 34.00,
    factor: 1.00
  },
  {
    name: 'Install 2" ISO Insulation 4x8 Panels Mechanically attached to n',
    total: 250.00,
    unit: '$/Ea.',
    picture: isoInsulationImg,
    category: 'INSULATION',
    coverage: 1,
    labor_cost: 65.00,
    material_cost: 185.00,
    factor: 1.00
  },
  {
    name: 'Install 6" Taper Edge where needed',
    total: 277.50,
    unit: '$/Ea.',
    picture: taperEdgeInsulationImg,
    category: 'INSULATION',
    coverage: 1,
    labor_cost: 52.50,
    material_cost: 225.00,
    factor: 1.00
  },
  {
    name: '2" #14 (1000 Count) Screws-',
    total: 122.60,
    unit: '$/Ea.',
    picture: roofingScrewsImg,
    category: 'INSULATION',
    coverage: 18,
    labor_cost: 0.00,
    material_cost: 122.60,
    factor: 1.00
  },
  {
    name: '2.5" #14(1000 Count) Screws-',
    total: 142.90,
    unit: '$/Ea.',
    picture: roofingScrewsImg,
    category: 'INSULATION',
    coverage: 18,
    labor_cost: 0.00,
    material_cost: 142.90,
    factor: 1.00
  },
  {
    name: '3" #14 (1000 Count) Screws-',
    total: 170.10,
    unit: '$/Ea.',
    picture: roofingScrewsImg,
    category: 'INSULATION',
    coverage: 18,
    labor_cost: 0.00,
    material_cost: 170.10,
    factor: 1.00
  },
  {
    name: '3.5" #14 (1000 Count) Screws-',
    total: 219.00,
    unit: '$/Ea.',
    picture: roofingScrewsImg,
    category: 'INSULATION',
    coverage: 18,
    labor_cost: 0.00,
    material_cost: 219.00,
    factor: 1.00
  },
  {
    name: '4" #14 (1000 Count) Screws-',
    total: 255.20,
    unit: '$/Ea.',
    picture: roofingScrewsImg,
    category: 'INSULATION',
    coverage: 18,
    labor_cost: 0.00,
    material_cost: 255.20,
    factor: 1.00
  },
  {
    name: '5" #14 (1000 Count) Screws-',
    total: 349.50,
    unit: '$/Ea.',
    picture: roofingScrewsImg,
    category: 'INSULATION',
    coverage: 18,
    labor_cost: 0.00,
    material_cost: 349.50,
    factor: 1.00
  },
  {
    name: '6" #14 (1000 Count) Screws-',
    total: 432.90,
    unit: '$/Ea.',
    picture: roofingScrewsImg,
    category: 'INSULATION',
    coverage: 18,
    labor_cost: 0.00,
    material_cost: 432.90,
    factor: 1.00
  },
  {
    name: 'Install Tapered Insulation "A"1/8" slope per foot,',
    total: 22.30,
    unit: '$/Ea.',
    picture: taperedInsulationImg,
    category: 'INSULATION',
    coverage: 1,
    labor_cost: 5.30,
    material_cost: 17.00,
    factor: 1.00
  },
  {
    name: 'Install Tapered Insulation "AA"1/8" slope per foot,',
    total: 18.55,
    unit: '$/Ea.',
    picture: taperedInsulationImg,
    category: 'INSULATION',
    coverage: 1,
    labor_cost: 5.30,
    material_cost: 13.25,
    factor: 1.00
  },
  {
    name: 'Install Tapered Insulation "B"1/6" slope per foot,',
    total: 28.60,
    unit: '$/Ea.',
    picture: taperedInsulationImg,
    category: 'INSULATION',
    coverage: 1,
    labor_cost: 5.30,
    material_cost: 23.30,
    factor: 1.00
  },
  {
    name: 'Install Tapered Insulation "C"1/8" slope per foot,',
    total: 35.50,
    unit: '$/Ea.',
    picture: taperedInsulationImg,
    category: 'INSULATION',
    coverage: 1,
    labor_cost: 5.30,
    material_cost: 30.20,
    factor: 1.00
  },
  {
    name: 'Install Tapered Insulation "D"1/8" slope per foot,',
    total: 41.30,
    unit: '$/Ea.',
    picture: taperedInsulationImg,
    category: 'INSULATION',
    coverage: 1,
    labor_cost: 5.30,
    material_cost: 36.00,
    factor: 1.00
  },
  {
    name: 'Install Tapered Insulation "E"1/8" slope per foot,',
    total: 48.45,
    unit: '$/Ea.',
    picture: taperedInsulationImg,
    category: 'INSULATION',
    coverage: 1,
    labor_cost: 5.30,
    material_cost: 43.15,
    factor: 1.00
  },
  {
    name: 'Install Tapered Insulation "F"1/8" slope per foot,',
    total: 54.20,
    unit: '$/Ea.',
    picture: taperedInsulationImg,
    category: 'INSULATION',
    coverage: 1,
    labor_cost: 5.30,
    material_cost: 48.90,
    factor: 1.00
  },
  {
    name: 'Install Tapered Insulation "FF"1/8" slope per foot,',
    total: 63.95,
    unit: '$/Ea.',
    picture: taperedInsulationImg,
    category: 'INSULATION',
    coverage: 1,
    labor_cost: 5.30,
    material_cost: 58.65,
    factor: 1.00
  },
  {
    name: 'Install R-SEAL 4" R-30',
    total: 1140.00,
    unit: '$/Ea.',
    picture: rSealInsulationImg,
    category: 'INSULATION',
    coverage: 3.3,
    labor_cost: 40.00,
    material_cost: 1100.00,
    factor: 1.00
  }
];

interface PinItem {
  id: string;
  name: string;
  total: number;
  unit: string;
  picture?: string;
  category: string;
  orderDescription?: string;
  unitDescription?: string;
  showInApp?: boolean;
  showOnEstimate?: boolean;
  showOnMaterialOrder?: boolean;
  showOnContract?: boolean;
  showOnLaborReport?: boolean;
  coverage?: number;
  labor_cost?: number;
  material_cost?: number;
  factor?: number;
}

interface PinsTabProps {
  quoteId: string;
}

export function PinsTab({ quoteId }: PinsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(PIN_CATEGORIES[0]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set([PIN_CATEGORIES[0]]));
  const [pins, setPins] = useState<PinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null);
  const [editingItem, setEditingItem] = useState<PinItem | null>(null);
  const [showFactorHelp, setShowFactorHelp] = useState(false);
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('simple');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [targetCategory, setTargetCategory] = useState<string>('');

  useEffect(() => {
    fetchPins();
  }, [quoteId]);

  const clearEquipmentCurb = async () => {
    const updatedPins = pins.filter(pin => pin.category !== 'EQUIPMENT CURB');
    await savePins(updatedPins);
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const deleteSelectedItems = async () => {
    const updatedPins = pins.filter(pin => !selectedItems.has(pin.id));
    await savePins(updatedPins);
    setSelectedItems(new Set());
    toast.success(`${selectedItems.size} item(s) deleted successfully`);
  };

  const moveSelectedItems = async () => {
    if (!targetCategory) {
      toast.error('Please select a target category');
      return;
    }
    
    const updatedPins = pins.map(pin => 
      selectedItems.has(pin.id) 
        ? { ...pin, category: targetCategory }
        : pin
    );
    
    await savePins(updatedPins);
    setSelectedItems(new Set());
    setShowMoveDialog(false);
    setTargetCategory('');
    toast.success(`${selectedItems.size} item(s) moved to ${targetCategory}`);
  };

  const loadDefaultEquipmentCurb = async () => {
    const defaultItems: PinItem[] = DEFAULT_EQUIPMENT_CURB_ITEMS.map((item, index) => ({
      ...item,
      id: `equipment-curb-${index + 1}`
    }));
    const updatedPins = [...pins, ...defaultItems];
    await savePins(updatedPins);
  };

  const loadDefaultHipStarters = async () => {
    const defaultItems: PinItem[] = DEFAULT_HIP_STARTERS_ITEMS.map((item, index) => ({
      ...item,
      id: `hip-starters-${index + 1}`
    }));
    const updatedPins = [...pins, ...defaultItems];
    await savePins(updatedPins);
  };

  const loadDefaultRemoveAndReplaceWood = async () => {
    const defaultItems: PinItem[] = DEFAULT_REMOVE_AND_REPLACE_WOOD_ITEMS.map((item, index) => ({
      ...item,
      id: `remove-replace-wood-${index + 1}`
    }));
    const updatedPins = [...pins, ...defaultItems];
    await savePins(updatedPins);
  };

  const loadDefaultOffRidgeVent = async () => {
    const defaultItems: PinItem[] = DEFAULT_OFF_RIDGE_VENT_ITEMS.map((item, index) => ({
      ...item,
      id: `off-ridge-vent-${index + 1}`
    }));
    const updatedPins = [...pins, ...defaultItems];
    await savePins(updatedPins);
  };

  const loadDefaultFlueChimneyCaps = async () => {
    const defaultItems: PinItem[] = DEFAULT_FLUE_CHIMNEY_CAPS_ITEMS.map((item, index) => ({
      ...item,
      id: `flue-chimney-caps-${index + 1}`
    }));
    const updatedPins = [...pins, ...defaultItems];
    await savePins(updatedPins);
  };

  const loadDefaultSkylights = async () => {
    const defaultItems: PinItem[] = DEFAULT_SKYLIGHTS_ITEMS.map((item, index) => ({
      ...item,
      id: `skylights-${index + 1}`
    }));
    const updatedPins = [...pins, ...defaultItems];
    await savePins(updatedPins);
  };

  const loadDefaultPlumbingBoots = async () => {
    const defaultItems: PinItem[] = DEFAULT_PLUMBING_BOOTS_ITEMS.map((item, index) => ({
      ...item,
      id: `plumbing-boots-${index + 1}`
    }));
    const updatedPins = [...pins, ...defaultItems];
    await savePins(updatedPins);
  };

  const loadDefaultChimneyFlashing = async () => {
    const defaultItems: PinItem[] = DEFAULT_CHIMNEY_FLASHING_ITEMS.map((item, index) => ({
      ...item,
      id: `chimney-flashing-${index + 1}`
    }));
    const updatedPins = [...pins, ...defaultItems];
    await savePins(updatedPins);
  };

  const loadDefaultPaintSealant = async () => {
    const defaultItems: PinItem[] = DEFAULT_PAINT_SEALANT_ITEMS.map((item, index) => ({
      ...item,
      id: `paint-sealant-${index + 1}`
    }));
    const updatedPins = [...pins, ...defaultItems];
    await savePins(updatedPins);
  };

  const loadDefaultMiscellaneous = async () => {
    const defaultItems: PinItem[] = DEFAULT_MISCELLANEOUS_ITEMS.map((item, index) => ({
      ...item,
      id: `miscellaneous-${index + 1}`
    }));
    const updatedPins = [...pins, ...defaultItems];
    await savePins(updatedPins);
  };

  const loadDefaultDownspouts = async () => {
    const defaultItems: PinItem[] = DEFAULT_DOWNSPOUTS_ITEMS.map((item, index) => ({
      ...item,
      id: `downspouts-${index + 1}`
    }));
    const updatedPins = [...pins, ...defaultItems];
    await savePins(updatedPins);
  };

  const loadDefaultInspectionPins = async () => {
    const defaultItems: PinItem[] = DEFAULT_INSPECTION_PINS_ITEMS.map((item, index) => ({
      ...item,
      id: `inspection-pins-${index + 1}`
    }));
    const updatedPins = [...pins, ...defaultItems];
    await savePins(updatedPins);
  };

  const loadDefaultInsulation = async () => {
    const defaultItems: PinItem[] = DEFAULT_INSULATION_ITEMS.map((item, index) => ({
      ...item,
      id: `insulation-${index + 1}`
    }));
    const updatedPins = [...pins, ...defaultItems];
    await savePins(updatedPins);
  };

  const loadDefaultExclusions = async () => {
    const defaultItems: PinItem[] = DEFAULT_EXCLUSIONS_ITEMS.map((item, index) => ({
      ...item,
      id: `exclusions-${index + 1}`
    }));
    const updatedPins = [...pins, ...defaultItems];
    await savePins(updatedPins);
  };

  const loadDefaultRemove = async () => {
    const defaultItems: PinItem[] = DEFAULT_REMOVE_ITEMS.map((item, index) => ({
      ...item,
      id: `remove-${index + 1}`
    }));
    const updatedPins = [...pins, ...defaultItems];
    await savePins(updatedPins);
  };

  const loadDefaultAdditionalItems = async () => {
    const defaultItems: PinItem[] = DEFAULT_ADDITIONAL_ITEMS.map((item, index) => ({
      ...item,
      id: `additional-items-${index + 1}`
    }));
    const updatedPins = [...pins, ...defaultItems];
    await savePins(updatedPins);
  };

  const fetchPins = async () => {
    try {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('pins')
        .eq('id', quoteId)
        .maybeSingle();

      if (error) throw error;
      
      // Define all default categories with their items and expected counts
      const defaultCategories = [
        { name: 'EQUIPMENT CURB', items: DEFAULT_EQUIPMENT_CURB_ITEMS, minCount: 10 },
        { name: 'HIP STARTERS', items: DEFAULT_HIP_STARTERS_ITEMS, minCount: 2 },
        { name: 'OFF-RIDGE VENT', items: DEFAULT_OFF_RIDGE_VENT_ITEMS, minCount: 10 },
        { name: 'FLUE & CHIMNEY CAPS', items: DEFAULT_FLUE_CHIMNEY_CAPS_ITEMS, minCount: 3 },
        { name: 'SKYLIGHTS', items: DEFAULT_SKYLIGHTS_ITEMS, minCount: 10 },
        { name: 'PLUMBING BOOTS', items: DEFAULT_PLUMBING_BOOTS_ITEMS, minCount: 10 },
        { name: 'CHIMNEY FLASHING', items: DEFAULT_CHIMNEY_FLASHING_ITEMS, minCount: 6 },
        { name: 'PAINT & SEALANT', items: DEFAULT_PAINT_SEALANT_ITEMS, minCount: 6 },
        { name: 'MISCELLANEOUS', items: DEFAULT_MISCELLANEOUS_ITEMS, minCount: 11 },
        { name: 'DOWNSPOUTS', items: DEFAULT_DOWNSPOUTS_ITEMS, minCount: 20 },
        { name: 'INSPECTION PINS', items: DEFAULT_INSPECTION_PINS_ITEMS, minCount: 7 },
        { name: 'INSULATION', items: DEFAULT_INSULATION_ITEMS, minCount: 18 },
        { name: 'ADDITIONAL ITEMS', items: DEFAULT_ADDITIONAL_ITEMS, minCount: 1 },
      ];
      
      if (data?.pins && Array.isArray(data.pins)) {
        const existingPins = data.pins as unknown as PinItem[];
        let allPins = [...existingPins];
        let needsUpdate = false;
        
        // First, update existing items that are missing pictures
        allPins = allPins.map(pin => {
          if (!pin.picture) {
            // Find the default item with matching name and category
            const defaultCategory = defaultCategories.find(cat => cat.name === pin.category);
            if (defaultCategory) {
              const defaultItem = defaultCategory.items.find(item => item.name === pin.name);
              if (defaultItem?.picture) {
                needsUpdate = true;
                return { ...pin, picture: defaultItem.picture };
              }
            }
          }
          return pin;
        });
        
        // Then, check and add missing default items for each category
        for (const category of defaultCategories) {
          const categoryItems = allPins.filter(pin => pin.category === category.name);
          const hasAllItems = categoryItems.length >= category.minCount;
          
          if (!hasAllItems) {
            const existingIds = new Set(allPins.map(pin => pin.id));
            const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and');
            
            const defaultItems: PinItem[] = category.items.map((item, index) => ({
              ...item,
              id: `${categorySlug}-${index + 1}`
            })).filter(item => !existingIds.has(item.id));
            
            if (defaultItems.length > 0) {
              allPins = [...allPins, ...defaultItems];
              needsUpdate = true;
            }
          }
        }
        
        if (needsUpdate) {
          setPins(allPins);
          // Save to database
          await supabase
            .from('quote_requests')
            .update({ pins: allPins as any })
            .eq('id', quoteId);
        } else {
          setPins(allPins);
        }
      } else {
        // No pins exist at all, initialize with all default items
        const defaultItems: PinItem[] = [];
        
        defaultCategories.forEach((category) => {
          const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and');
          const items = category.items.map((item, index) => ({
            ...item,
            id: `${categorySlug}-${index + 1}`
          }));
          defaultItems.push(...items);
        });
        
        setPins(defaultItems);
        // Save to database
        await supabase
          .from('quote_requests')
          .update({ pins: defaultItems as any })
          .eq('id', quoteId);
      }
    } catch (error) {
      console.error('Error fetching pins:', error);
      toast.error('Failed to load pins');
    } finally {
      setLoading(false);
    }
  };

  const savePins = async (updatedPins: PinItem[]) => {
    try {
      const { error } = await supabase
        .from('quote_requests')
        .update({ pins: updatedPins as any })
        .eq('id', quoteId);

      if (error) throw error;
      setPins(updatedPins);
      toast.success('Pins saved');
    } catch (error) {
      console.error('Error saving pins:', error);
      toast.error('Failed to save pins');
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
    setSelectedCategory(category);
  };

  const getCategoryItems = (category: string) => {
    return pins.filter(pin => pin.category === category);
  };

  const updatePinItem = (pinId: string, field: string, value: any) => {
    const updatedPins = pins.map(pin => 
      pin.id === pinId ? { ...pin, [field]: value } : pin
    );
    savePins(updatedPins);
  };

  const addNewItem = (category: string) => {
    const newPin: PinItem = {
      id: `pin-${Date.now()}`,
      name: '',
      total: 0,
      unit: '$/Ea.',
      category: category,
      showInApp: true,
      showOnEstimate: true,
      showOnMaterialOrder: true,
      showOnContract: true,
      showOnLaborReport: true,
    };
    savePins([...pins, newPin]);
  };

  const handleItemSettingsSave = (updatedItem: PinItem) => {
    const updatedPins = pins.map(pin => 
      pin.id === updatedItem.id ? updatedItem : pin
    );
    savePins(updatedPins);
  };

  const currentItems = selectedCategory ? getCategoryItems(selectedCategory) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 bg-background h-[calc(100vh-300px)]">
      {/* Top Header Bar with View Buttons */}
      <div className="flex items-center justify-end gap-2 px-6 py-3 border-b bg-background">
        <Button 
          variant={viewMode === 'simple' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('simple')}
        >
          Simple View
        </Button>
        <Button 
          variant={viewMode === 'detailed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('detailed')}
        >
          Detailed View
        </Button>
      </div>
      
      {/* Content Area with Sidebar */}
      <div className="flex gap-0 flex-1 overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-64 bg-muted/30 border-r">
        <ScrollArea className="h-full">
          <div className="p-2 space-y-0.5">
            {PIN_CATEGORIES.map((category) => {
              const isExpanded = expandedCategories.has(category);
              const isSelected = selectedCategory === category;
              const itemCount = getCategoryItems(category).length;

              return (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors
                      ${isSelected 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'text-foreground hover:bg-muted/50'
                      }`}
                  >
                    <span>{category}</span>
                    {itemCount > 0 && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        {itemCount}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-background overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6">
          {selectedCategory && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{selectedCategory}</h2>
                <div className="flex gap-2">
                  {selectedItems.size > 0 && (
                    <>
                      <Button 
                        onClick={() => setShowMoveDialog(true)}
                        size="sm"
                        variant="outline"
                      >
                        <MoveRight className="w-4 h-4 mr-2" />
                        Move Selected ({selectedItems.size})
                      </Button>
                      <Button 
                        onClick={deleteSelectedItems}
                        size="sm"
                        variant="destructive"
                      >
                        Delete Selected ({selectedItems.size})
                      </Button>
                    </>
                  )}
                  {selectedCategory === 'EQUIPMENT CURB' && currentItems.length > 0 && (
                    <Button 
                      onClick={clearEquipmentCurb}
                      size="sm"
                      variant="destructive"
                    >
                      Clear All
                    </Button>
                  )}
                  <Button 
                    onClick={() => addNewItem(selectedCategory)}
                    size="sm"
                  >
                    Add Item
                  </Button>
                </div>
              </div>

              {/* Table Header */}
              <div className="border rounded-lg overflow-hidden">
                {viewMode === 'simple' ? (
                  <div className="bg-muted/50 grid grid-cols-[40px,1fr,120px,100px,80px,50px] gap-4 px-4 py-3 font-medium text-sm">
                    <div></div>
                    <div>Name</div>
                    <div>Total</div>
                    <div>Unit</div>
                    <div>Picture</div>
                    <div></div>
                  </div>
                ) : (
                  <div className="bg-muted/50 grid grid-cols-[40px,1fr,80px,80px,80px,80px,100px,80px,80px,50px] gap-4 px-4 py-3 font-medium text-sm">
                    <div></div>
                    <div>Name</div>
                    <div>Coverage</div>
                    <div>Labor</div>
                    <div>Material</div>
                    <div className="flex items-center gap-1">
                      Factor
                      <button 
                        onClick={() => setShowFactorHelp(true)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        ⓘ
                      </button>
                    </div>
                    <div>Total</div>
                    <div>Unit</div>
                    <div>Picture</div>
                    <div></div>
                  </div>
                )}

                {/* Table Rows */}
                <div className="divide-y">
                  {currentItems.length === 0 ? (
                    <div className="px-4 py-12 text-center text-muted-foreground">
                      <p className="mb-4">No items added yet.</p>
                      {selectedCategory === 'EQUIPMENT CURB' && (
                        <Button 
                          onClick={loadDefaultEquipmentCurb}
                          size="sm"
                        >
                          Load Default Items
                        </Button>
                      )}
                      {selectedCategory === 'HIP STARTERS' && (
                        <Button 
                          onClick={loadDefaultHipStarters}
                          size="sm"
                        >
                          Load Default Items
                        </Button>
                      )}
                      {selectedCategory === 'REMOVE AND REPLACE WOOD' && (
                        <Button 
                          onClick={loadDefaultRemoveAndReplaceWood}
                          size="sm"
                        >
                          Load Default Items
                        </Button>
                      )}
                      {selectedCategory === 'OFF-RIDGE VENT' && (
                        <Button 
                          onClick={loadDefaultOffRidgeVent}
                          size="sm"
                        >
                          Load Default Items
                        </Button>
                      )}
                      {selectedCategory === 'FLUE & CHIMNEY CAPS' && (
                        <Button 
                          onClick={loadDefaultFlueChimneyCaps}
                          size="sm"
                        >
                          Load Default Items
                        </Button>
                      )}
                      {selectedCategory === 'SKYLIGHTS' && (
                        <Button 
                          onClick={loadDefaultSkylights}
                          size="sm"
                        >
                          Load Default Items
                        </Button>
                      )}
                      {selectedCategory === 'PLUMBING BOOTS' && (
                        <Button 
                          onClick={loadDefaultPlumbingBoots}
                          size="sm"
                        >
                          Load Default Items
                        </Button>
                      )}
                      {selectedCategory === 'CHIMNEY FLASHING' && (
                        <Button 
                          onClick={loadDefaultChimneyFlashing}
                          size="sm"
                        >
                          Load Default Items
                        </Button>
                      )}
                      {selectedCategory === 'PAINT & SEALANT' && (
                        <Button 
                          onClick={loadDefaultPaintSealant}
                          size="sm"
                        >
                          Load Default Items
                        </Button>
                      )}
                      {selectedCategory === 'MISCELLANEOUS' && (
                        <Button 
                          onClick={loadDefaultMiscellaneous}
                          size="sm"
                        >
                          Load Default Items
                        </Button>
                      )}
                      {selectedCategory === 'DOWNSPOUTS' && (
                        <Button 
                          onClick={loadDefaultDownspouts}
                          size="sm"
                        >
                          Load Default Items
                        </Button>
                      )}
                      {selectedCategory === 'INSPECTION PINS' && (
                        <Button 
                          onClick={loadDefaultInspectionPins}
                          size="sm"
                        >
                          Load Default Items
                        </Button>
                      )}
                      {selectedCategory === 'INSULATION' && (
                        <Button 
                          onClick={loadDefaultInsulation}
                          size="sm"
                        >
                          Load Default Items
                        </Button>
                      )}
                      {selectedCategory === 'EXCLUSIONS' && (
                        <Button 
                          onClick={loadDefaultExclusions}
                          size="sm"
                        >
                          Load Default Items
                        </Button>
                      )}
                      {selectedCategory === 'REMOVE' && (
                        <Button 
                          onClick={loadDefaultRemove}
                          size="sm"
                        >
                          Load Default Items
                        </Button>
                      )}
                      {selectedCategory === 'ADDITIONAL ITEMS' && (
                        <Button 
                          onClick={loadDefaultAdditionalItems}
                          size="sm"
                        >
                          Load Default Items
                        </Button>
                      )}
                    </div>
                  ) : (
                    currentItems.map((item) => (
                      viewMode === 'simple' ? (
                        <div 
                          key={item.id} 
                          className="grid grid-cols-[40px,1fr,120px,100px,80px,50px] gap-4 px-4 py-3 items-center hover:bg-muted/30"
                        >
                          <Checkbox 
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={() => toggleItemSelection(item.id)}
                          />
                          <Input
                            value={item.name}
                            onChange={(e) => updatePinItem(item.id, 'name', e.target.value)}
                            placeholder="Item description"
                            className="border-none bg-transparent"
                          />
                          <Input
                            type="number"
                            value={item.total}
                            onChange={(e) => updatePinItem(item.id, 'total', parseFloat(e.target.value) || 0)}
                            className="border-none bg-transparent"
                          />
                          <div className="text-sm text-muted-foreground">{item.unit}</div>
                          <button 
                            onClick={() => item.picture && setViewingImage({ url: item.picture, name: item.name })}
                            className="w-10 h-10 rounded bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors overflow-hidden"
                          >
                            {item.picture ? (
                              <OptimizedImage 
                                src={item.picture} 
                                alt={item.name} 
                                className="w-full h-full object-cover"
                                loading="lazy"
                                placeholder="blur"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-muted-foreground" />
                            )}
                          </button>
                          <button 
                            onClick={() => setEditingItem(item)}
                            className="w-8 h-8 rounded hover:bg-muted transition-colors flex items-center justify-center"
                          >
                            <Settings className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          key={item.id} 
                          className="grid grid-cols-[40px,1fr,80px,80px,80px,80px,100px,80px,80px,50px] gap-4 px-4 py-3 items-center hover:bg-muted/30"
                        >
                          <Checkbox 
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={() => toggleItemSelection(item.id)}
                          />
                          <Input
                            value={item.name}
                            onChange={(e) => updatePinItem(item.id, 'name', e.target.value)}
                            placeholder="Item description"
                            className="border-none bg-transparent"
                          />
                          <Input
                            type="number"
                            value={item.coverage || ''}
                            onChange={(e) => updatePinItem(item.id, 'coverage', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="border-none bg-transparent"
                          />
                          <Input
                            type="number"
                            value={item.labor_cost || ''}
                            onChange={(e) => updatePinItem(item.id, 'labor_cost', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="border-none bg-transparent"
                          />
                          <Input
                            type="number"
                            value={item.material_cost || ''}
                            onChange={(e) => updatePinItem(item.id, 'material_cost', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="border-none bg-transparent"
                          />
                          <Input
                            type="number"
                            value={item.factor || ''}
                            onChange={(e) => updatePinItem(item.id, 'factor', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="border-none bg-transparent"
                          />
                          <Input
                            type="number"
                            value={item.total}
                            onChange={(e) => updatePinItem(item.id, 'total', parseFloat(e.target.value) || 0)}
                            className="border-none bg-transparent"
                          />
                          <div className="text-sm text-muted-foreground">{item.unit}</div>
                          <button 
                            onClick={() => item.picture && setViewingImage({ url: item.picture, name: item.name })}
                            className="w-10 h-10 rounded bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors overflow-hidden"
                          >
                            {item.picture ? (
                              <OptimizedImage 
                                src={item.picture} 
                                alt={item.name} 
                                className="w-full h-full object-cover"
                                loading="lazy"
                                placeholder="blur"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-muted-foreground" />
                            )}
                          </button>
                          <button 
                            onClick={() => setEditingItem(item)}
                            className="w-8 h-8 rounded hover:bg-muted transition-colors flex items-center justify-center"
                          >
                            <Settings className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      )
                    ))
                  )}
                </div>
              </div>
            </>
          )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Close Content Area wrapper */}
      </div>

      {/* Image Viewer Dialog */}
      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogTitle className="sr-only">View Image</DialogTitle>
          {viewingImage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{viewingImage.name}</h3>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setViewingImage(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="rounded-lg overflow-hidden bg-muted">
                <img 
                  src={IMAGE_MAP[viewingImage.url] || viewingImage.url} 
                  alt={viewingImage.name} 
                  className="w-full h-auto"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Material Item Settings Dialog */}
      <MaterialItemSettingsDialog
        item={editingItem}
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleItemSettingsSave}
      />

      {/* Factor Help Dialog */}
      <Dialog open={showFactorHelp} onOpenChange={setShowFactorHelp}>
        <DialogContent className="max-w-4xl">
          <DialogTitle className="text-2xl font-bold">FACTOR HELP</DialogTitle>
          <div className="space-y-6">
            <p className="text-foreground">
              The factor column is the markup of the combined costs (labor + material) of each item. The sum of 
              the item's costs are multiplied by the factor to reach the desired total charge price per unit.
            </p>

            <div>
              <p className="font-bold">EXAMPLE:</p>
              <p>1.00 (Labor Cost) + 1.00 (Material Cost) * 2.00 (Factor/Markup) = 4.00 (Total Price)</p>
            </div>

            <div>
              <p className="font-bold">NOTE:</p>
              <p>You can enter your desired total price per unit and the factor multiplier will adjust 
              automatically to meet the specified total.</p>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-2 bg-muted/50 font-semibold">
                <div className="px-6 py-3 border-r">Desired Margin</div>
                <div className="px-6 py-3">Factor</div>
              </div>
              <div className="divide-y">
                {[
                  { margin: '15%', factor: '1.18' },
                  { margin: '20%', factor: '1.25' },
                  { margin: '25%', factor: '1.33' },
                  { margin: '30%', factor: '1.43' },
                  { margin: '35%', factor: '1.54' }
                ].map((row, index) => (
                  <div key={index} className="grid grid-cols-2">
                    <div className="px-6 py-3 border-r">{row.margin}</div>
                    <div className="px-6 py-3">{row.factor}</div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              <a href="#" className="text-primary hover:underline">Click here</a> for the full documentation of this setting on our support site!
            </p>

            <div className="flex justify-end">
              <Button onClick={() => setShowFactorHelp(false)}>
                CLOSE
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move Items Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="max-w-md">
          <DialogTitle>Move Selected Items</DialogTitle>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Move {selectedItems.size} selected item(s) to a different category.
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Category</label>
              <Select value={targetCategory} onValueChange={setTargetCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {PIN_CATEGORIES.filter(cat => cat !== selectedCategory).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={moveSelectedItems} disabled={!targetCategory}>
                Move Items
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
