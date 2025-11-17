import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export function NOSESNOTPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');

  const doctorId = searchParams.get('doctor');
  const key = searchParams.get('key');

  const handleSubmit = () => {
    if (!selectedAnswer) return;

    // Build query params
    const params = new URLSearchParams();
    if (doctorId) params.append('doctor', doctorId);
    if (key) params.append('key', key);

    // Route based on answer
    if (selectedAnswer === 'A') {
      // Navigate to NOSE quiz
      navigate(`/quiz?type=NOSE&mode=single&${params.toString()}`);
    } else {
      // Navigate to SNOT-12 quiz
      navigate(`/quiz?type=SNOT12&mode=single&${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">NOSE-SNOT Assessment</h1>
          <p className="text-lg text-muted-foreground">Personalized nasal and sinus symptom evaluation</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Is your breathing difficulty mainly due to nasal blockage or stuffiness, or do you also have other symptoms like facial pressure, headaches, postnasal drip, or a reduced sense of smell?
                </h2>
              </div>

              <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="A" id="option-a" />
                  <Label htmlFor="option-a" className="flex-1 cursor-pointer text-base">
                    <span className="font-semibold">A.</span> Nasal blockage/stuffiness
                  </Label>
                </div>

                <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="B" id="option-b" />
                  <Label htmlFor="option-b" className="flex-1 cursor-pointer text-base">
                    <span className="font-semibold">B.</span> Sinus-related symptoms like facial pressure, headaches, or a reduced sense of smell
                  </Label>
                </div>
              </RadioGroup>

              <Button 
                onClick={handleSubmit} 
                disabled={!selectedAnswer}
                className="w-full"
                size="lg"
              >
                Continue to Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
