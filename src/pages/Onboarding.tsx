import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, Check, Youtube, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { completeOnboarding } from '@/lib/api/profiles';

const creatorTypes = ['Educational', 'Vlog', 'Podcast', 'Tech', 'Fitness', 'Photography', 'Business', 'Other'];
const platforms = ['YouTube', 'Instagram', 'TikTok', 'LinkedIn', 'X'];
const tones = ['Casual', 'Professional', 'Cinematic', 'Funny', 'Minimal', 'Emotional'];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [creatorType, setCreatorType] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [tone, setTone] = useState('');
  const [wordsToUse, setWordsToUse] = useState<string[]>([]);
  const [wordsToAvoid, setWordsToAvoid] = useState<string[]>([]);
  const [aboutMe, setAboutMe] = useState('');
  const [wordInput, setWordInput] = useState('');
  const [avoidInput, setAvoidInput] = useState('');
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const addWord = (type: 'use' | 'avoid') => {
    const input = type === 'use' ? wordInput : avoidInput;
    if (!input.trim()) return;
    if (type === 'use') {
      setWordsToUse([...wordsToUse, input.trim()]);
      setWordInput('');
    } else {
      setWordsToAvoid([...wordsToAvoid, input.trim()]);
      setAvoidInput('');
    }
  };

  const removeWord = (word: string, type: 'use' | 'avoid') => {
    if (type === 'use') {
      setWordsToUse(wordsToUse.filter(w => w !== word));
    } else {
      setWordsToAvoid(wordsToAvoid.filter(w => w !== word));
    }
  };

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    
    // Final step - save to database
    if (!user) {
      toast.error('Please sign in to continue');
      return;
    }

    setIsLoading(true);
    try {
      await completeOnboarding(user.id, {
        creator_type: creatorType,
        platforms: selectedPlatforms,
        personal_style: {
          tone,
          wordsToUse,
          wordsToAvoid,
          aboutMe,
          exampleCaptions: [],
        },
      });
      toast.success('Setup complete!');
      navigate('/app/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center py-8">
          <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Let's set up your account</h1>
          <p className="text-muted-foreground">This will help us personalize your experience</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'h-2 w-16 rounded-full transition-all',
                s <= step ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <Card className="animate-fade-in">
            <CardContent className="p-6 space-y-6">
              <div>
                <Label className="text-base font-medium">What type of creator are you?</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  {creatorTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setCreatorType(type)}
                      className={cn(
                        'p-3 rounded-lg border text-sm font-medium transition-all',
                        creatorType === type
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Which platforms do you use?</Label>
                <div className="flex flex-wrap gap-3 mt-3">
                  {platforms.map((platform) => (
                    <label
                      key={platform}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all',
                        selectedPlatforms.includes(platform)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <Checkbox
                        checked={selectedPlatforms.includes(platform)}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedPlatforms([...selectedPlatforms, platform]);
                          else setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
                        }}
                      />
                      <span className="text-sm font-medium">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={handleNext} className="w-full gradient-primary text-primary-foreground">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <Card className="animate-fade-in">
            <CardContent className="p-6 space-y-6">
              <div>
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select your tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {tones.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Words to use</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add a word..."
                    value={wordInput}
                    onChange={(e) => setWordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addWord('use')}
                  />
                  <Button variant="outline" onClick={() => addWord('use')}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {wordsToUse.map((word) => (
                    <Badge key={word} variant="secondary" className="gap-1">
                      {word}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeWord(word, 'use')} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Words to avoid</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add a word..."
                    value={avoidInput}
                    onChange={(e) => setAvoidInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addWord('avoid')}
                  />
                  <Button variant="outline" onClick={() => addWord('avoid')}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {wordsToAvoid.map((word) => (
                    <Badge key={word} variant="destructive" className="gap-1">
                      {word}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeWord(word, 'avoid')} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>About me</Label>
                <Textarea
                  className="mt-2"
                  placeholder="Tell us about yourself and your content style..."
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value)}
                  rows={4}
                />
              </div>

              <Button onClick={handleNext} className="w-full gradient-primary text-primary-foreground">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <Card className="animate-fade-in">
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <div className="h-16 w-16 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <Youtube className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Connect YouTube</h2>
                <p className="text-muted-foreground">
                  Sync your channel to start generating content from your videos.
                  <br />
                  <span className="text-sm">(You can skip this and connect later in Settings)</span>
                </p>
              </div>

              {!youtubeConnected ? (
                <Button
                  onClick={() => {
                    // TODO: Implement real YouTube OAuth
                    toast.info('YouTube OAuth coming soon! You can connect in Settings.');
                  }}
                  className="w-full"
                  variant="outline"
                >
                  <Youtube className="mr-2 h-5 w-5 text-destructive" />
                  Connect YouTube
                </Button>
              ) : (
                <div className="p-4 rounded-lg border border-success/50 bg-success/10">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                      <Check className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">Channel Connected</p>
                      <p className="text-sm text-muted-foreground">Synced just now</p>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleNext} 
                className="w-full gradient-primary text-primary-foreground"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
