import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface Doctor {
  name: string;
  gender: 'male' | 'female';
  specialty: string;
  email: string;
  qualification?: string;
  phone?: string;
  dateOfBirth?: string;
  experienceYears?: number;
  avatarUrl?: string;
  schedule: {
    [key: string]: TimeSlot[];
  };
}

interface DoctorFormProps {
  initialData: Doctor;
  onSave: (data: Doctor) => void;
  onCancel: () => void;
}

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function DoctorForm({ initialData, onSave, onCancel }: DoctorFormProps) {
  const [doctor, setDoctor] = useState<Doctor>(initialData);
  const [selectedDay, setSelectedDay] = useState<string>('monday');
  const [newTimeSlot, setNewTimeSlot] = useState<TimeSlot>({ startTime: '', endTime: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDoctor(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTimeSlot = () => {
    if (!newTimeSlot.startTime || !newTimeSlot.endTime) return;

    setDoctor(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [selectedDay]: [...(prev.schedule[selectedDay] || []), newTimeSlot]
      }
    }));

    setNewTimeSlot({ startTime: '', endTime: '' });
  };

  const handleRemoveTimeSlot = (day: string, index: number) => {
    setDoctor(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: prev.schedule[day].filter((_, i) => i !== index)
      }
    }));
  };

  const handleSave = () => {
    onSave(doctor);
  };

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={doctor.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label>Gender</Label>
          <RadioGroup
            value={doctor.gender}
            onValueChange={(value: 'male' | 'female') => 
              setDoctor(prev => ({ ...prev, gender: value }))
            }
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id="male" />
              <Label htmlFor="male">Male</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id="female" />
              <Label htmlFor="female">Female</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label htmlFor="specialty">Specialty</Label>
          <Input
            id="specialty"
            name="specialty"
            value={doctor.specialty}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={doctor.email}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="qualification">Qualification</Label>
          <Input
            id="qualification"
            name="qualification"
            value={doctor.qualification || ''}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={doctor.phone || ''}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={doctor.dateOfBirth || ''}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <Label htmlFor="experienceYears">Years of Experience</Label>
          <Input
            id="experienceYears"
            name="experienceYears"
            type="number"
            value={doctor.experienceYears || ''}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Schedule</h3>
        
        <div className="flex space-x-4">
          <Select value={selectedDay} onValueChange={setSelectedDay}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select day" />
            </SelectTrigger>
            <SelectContent>
              {DAYS_OF_WEEK.map(day => (
                <SelectItem key={day} value={day}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="time"
            value={newTimeSlot.startTime}
            onChange={e => setNewTimeSlot(prev => ({ ...prev, startTime: e.target.value }))}
            className="w-[150px]"
          />
          <Input
            type="time"
            value={newTimeSlot.endTime}
            onChange={e => setNewTimeSlot(prev => ({ ...prev, endTime: e.target.value }))}
            className="w-[150px]"
          />
          <Button type="button" onClick={handleAddTimeSlot}>
            Add Time Slot
          </Button>
        </div>

        <div className="space-y-2">
          {doctor.schedule[selectedDay]?.map((slot, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span>{slot.startTime} - {slot.endTime}</span>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleRemoveTimeSlot(selectedDay, index)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSave}>
          Save Doctor
        </Button>
      </div>
    </div>
  );
} 