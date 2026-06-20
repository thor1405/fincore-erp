import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Building, Users } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function AcceptInvite() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const response = await fetch(`/api/team/invite/${id}`);
        if (!response.ok) {
          throw new Error('Invitation not found or invalid');
        }
        const data = await response.json();
        setInvite(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [id]);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const response = await fetch(`/api/team/invite/${id}/accept`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to accept invitation');
      }
      setAccepted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAccepting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-body)' }}>
        <p>Loading invitation...</p>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-body)', padding: '20px' }}>
        <Card style={{ maxWidth: '400px', width: '100%' }}>
          <CardHeader title="Invalid Invitation" icon={<AlertCircle color="var(--color-red)" />} />
          <CardContent>
            <p style={{ color: 'var(--text-secondary)' }}>{error}. Please ask your administrator to send a new invite link.</p>
            <Button onClick={() => navigate('/login')} style={{ marginTop: '16px', width: '100%' }}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-body)', padding: '20px' }}>
      <Card style={{ maxWidth: '480px', width: '100%' }} className="animate-fade-in">
        <div style={{ textAlign: 'center', padding: '32px 20px 0' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--color-indigo)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' }}>
            <Building size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            Join {invite?.user?.name || 'Your Team'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
            You've been invited to join the workspace as a <strong>{invite.role}</strong>.
          </p>
        </div>
        
        <CardContent style={{ marginTop: '24px' }}>
          {accepted ? (
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#dcfce7', borderRadius: '8px', color: '#166534' }}>
              <CheckCircle size={32} style={{ margin: '0 auto 8px' }} />
              <h3 style={{ margin: '0 0 4px', fontWeight: 600 }}>Invitation Accepted!</h3>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Your account is now active. You can log in to the portal.</p>
              <Button onClick={() => navigate('/login')} style={{ marginTop: '16px', width: '100%' }}>Proceed to Login</Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-element)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Users size={20} color="var(--color-indigo)" />
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 500 }}>{invite.name}</p>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{invite.email}</p>
                  </div>
                </div>
              </div>
              
              {error && <p style={{ color: 'var(--color-red)', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
              
              <Button onClick={handleAccept} disabled={isAccepting} style={{ width: '100%', padding: '12px' }}>
                {isAccepting ? 'Accepting...' : 'Accept Invitation'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

